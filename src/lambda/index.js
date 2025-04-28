const AWS = require("aws-sdk")
const db = new AWS.DynamoDB.DocumentClient()

const EXPECTED_API_KEY = "your-api-key-pls"

exports.handler = async (event) => {
  const tableName = "ranked_scores"
  const method = event.requestContext.http.method
  const apiKey = event.headers ? event.headers['x-api-key'] : null

  // --- START: API Key Check ---
  if (apiKey !== EXPECTED_API_KEY) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Unauthorized" })
    }
  }
  // --- END: API Key Check ---

  // Submit a score
  if (method === "POST") {
    try {
      const body = JSON.parse(event.body)
      let { username, score } = body

      // Check if username and score are provided and valid (number more than 0 cos that score sucks!!!!)
      if (!username || typeof score !== "number"|| score <= 0) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: "Username and score are required" })
        }
      }

      score = Number(score)
      if (isNaN(score)) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: "Score must be a valid number" })
        }
      }

      // --- START: Query existing highest score ---
      const queryParams = {
        TableName: tableName,
        IndexName: "leaderboard-score-index",
        KeyConditionExpression: "leaderboard = :lb",
        FilterExpression: "username = :uname", // Filter results for the specific user
        ExpressionAttributeValues: {
          ":lb": "global",
          ":uname": username
        },
        ProjectionExpression: "score, #ts", // Get score and timestamp
        ExpressionAttributeNames: { "#ts": "timestamp" }, // Alias for timestamp
        ScanIndexForward: false, // Sort by score descending
        Limit: 1 // We only need the top one
      }

      const existingData = await db.query(queryParams).promise()
      const existingHighestScoreItem = existingData.Items.length > 0 ? existingData.Items[0] : null
      // --- END: Query existing highest score ---

      // --- START: Conditional Write based on score comparison ---
      if (existingHighestScoreItem === null || score > existingHighestScoreItem.score) {
        // New score is higher or it's the first score for this user
        await db.put({
          TableName: tableName,
          Item: {
            username,
            score,
            leaderboard: "global",
            timestamp: Date.now() 
          }
        }).promise()

        // If there was an old score delete it
        if (existingHighestScoreItem !== null) {
          try {
            await db.delete({
              TableName: tableName,
              Key: {
                username: username,
                timestamp: existingHighestScoreItem.timestamp // The timestamp of the OLD item
              }
            }).promise()
          } catch (deleteErr) {
            // Log the error but don't fail the request
            console.error(`Failed to delete old score for ${username} with timestamp ${existingHighestScoreItem.timestamp}:`, deleteErr)
          }
        }

        return {
          statusCode: 200,
          headers: { "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify({ message: "Score submitted successfully" })
        }
      } else {
        // New score is not higher
        return {
          statusCode: 200, // Or maybe 409 Conflict? 200 is fine as per original code
          headers: { "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify({ message: "Score not updated: new score is not higher" })
        }
      }
      // --- END: Conditional Write based on score comparison ---
    } catch (err) {
      console.error("Error submitting score:", err)
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "Internal Server Error" })
      }
    }
  }

  // Get leaderboard and player rank
  if (method === "GET") {
    const playerUsername = event.queryStringParameters?.username

    try {
      // Get Top 10 Scores
      const topData = await db.query({
        TableName: tableName,
        IndexName: "leaderboard-score-index",
        KeyConditionExpression: "leaderboard = :lb",
        ExpressionAttributeValues: {
          ":lb": "global"
        },
        ScanIndexForward: false,
        Limit: 10
      }).promise()

      const topScores = topData.Items.map(item => ({
        username: item.username,
        score: item.score
      }))

      // Get Player Rank (if requested)
      let playerRank = null
      let playerScore = null

      if (playerUsername) {
        const allData = await db.query({
          TableName: tableName,
          IndexName: "leaderboard-score-index",
          KeyConditionExpression: "leaderboard = :lb",
          ExpressionAttributeValues: {
            ":lb": "global"
          },
          ScanIndexForward: false
        }).promise()

        for (let i = 0; i < allData.Items.length; i++) {
          if (allData.Items[i].username === playerUsername) {
            playerRank = i + 1
            playerScore = allData.Items[i].score
            break
          }
        }
      }

      return {
        statusCode: 200,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          topScores,
          playerScore,
          playerRank
        })
      }
    } catch (err) {
      console.error("Error fetching leaderboard:", err)
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "Internal Server Error" })
      }
    }
  }

  // Fallback for unhandled methods (after API key check)
  return {
    statusCode: 405,
    body: JSON.stringify({ message: "Method Not Allowed" })
  }
}
