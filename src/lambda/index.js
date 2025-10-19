const AWS = require("aws-sdk")
const db = new AWS.DynamoDB.DocumentClient()

const EXPECTED_API_KEY = "your-api-key-pls"

exports.handler = async (event) => {
  const tableName = "ranked_scores"
  const method = event.requestContext.http.method
  const apiKey = event.headers?.['x-api-key'] || event.headers?.['X-Api-Key'] || null;

  // Dynamically set Access-Control-Allow-Origin
  const origin = 'https://pvellacott.github.io';
  const corsHeaders = {
    "Access-Control-Allow-Origin": origin, 
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Api-Key",
    "Access-Control-Max-Age": 86400 // Cache preflight response for 24 hours
  };

  // --- Handle CORS Preflight ---
  if (method === "OPTIONS") {
    return {
      statusCode: 204,
      headers: corsHeaders
    };
  }

  // --- START: API Key Check ---
  if (apiKey !== EXPECTED_API_KEY) {
    return {
      statusCode: 401,
      headers: corsHeaders,
      body: JSON.stringify({ message: "Unauthorized" })
    }
  }

  // --- POST: Submit Score ---
  if (method === "POST") {
    try {
      const body = JSON.parse(event.body)
      let { username, score } = body

      if (!username || typeof score !== "number" || score <= 0) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ message: "Username and score are required" })
        }
      }

      score = Number(score)
      if (isNaN(score)) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ message: "Score must be a valid number" })
        }
      }

      // Get all scores from the leaderboard
      const queryParams = {
        TableName: tableName,
        IndexName: "leaderboard-score-index",
        KeyConditionExpression: "leaderboard = :lb",
        ExpressionAttributeValues: {
          ":lb": "global"
        },
        ProjectionExpression: "username, score, #ts",
        ExpressionAttributeNames: { "#ts": "timestamp" },
        ScanIndexForward: false
      }

      console.log("Getting all scores with params:", JSON.stringify(queryParams, null, 2))
      const allScores = await db.query(queryParams).promise()
      console.log("All scores result:", JSON.stringify(allScores, null, 2))
      
      // Filter scores for this specific user
      const userScores = allScores.Items.filter(item => item.username === username)
      console.log("User scores:", JSON.stringify(userScores, null, 2))
      
      // Check for duplicate score
      const exactDuplicate = userScores.find(item => item.score === score)
      if (exactDuplicate) {
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({ message: "Score not updated: score already exists" })
        }
      }

      // Get the highest score from the user's existing scores
      const existingHighestScoreItem = userScores.length > 0 ? userScores[0] : null

      // Only allow if no existing score OR if new score is strictly higher
      if (existingHighestScoreItem === null || score > existingHighestScoreItem.score) {
        await db.put({
          TableName: tableName,
          Item: {
            username,
            score,
            leaderboard: "global",
            timestamp: Date.now()
          }
        }).promise()

        if (existingHighestScoreItem !== null) {
          try {
            await db.delete({
              TableName: tableName,
              Key: {
                username: username,
                timestamp: existingHighestScoreItem.timestamp
              }
            }).promise()
          } catch (deleteErr) {
            console.error(`Failed to delete old score for ${username}:`, deleteErr)
          }
        }

        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({ message: "Score submitted successfully" })
        }
      } else {
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({ message: "Score not updated: new score is not higher than existing score" })
        }
      }
    } catch (err) {
      console.error("Error submitting score:", err)
      console.error("Error details:", {
        message: err.message,
        code: err.code,
        statusCode: err.statusCode,
        stack: err.stack
      })
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ 
          message: "Internal Server Error",
          error: err.message,
          code: err.code || "UNKNOWN_ERROR"
        })
      }
    }
  }

  // --- GET: Fetch Leaderboard ---
  if (method === "GET") {
    const playerUsername = event.queryStringParameters?.username

    try {
      const topData = await db.query({
        TableName: tableName,
        IndexName: "leaderboard-score-index",
        KeyConditionExpression: "leaderboard = :lb",
        ExpressionAttributeValues: {
          ":lb": "global"
        },
        ScanIndexForward: false,
        Limit: 1000
      }).promise()

      const topScores = topData.Items.map(item => ({
        username: item.username,
        score: item.score
      }))

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
        headers: corsHeaders,
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
        headers: corsHeaders,
        body: JSON.stringify({ message: "Internal Server Error: " + err.message })
      }
    }
  }

  // --- Fallback for unsupported methods ---
  return {
    statusCode: 405,
    headers: corsHeaders,
    body: JSON.stringify({ message: "Method Not Allowed" })
  }
}
