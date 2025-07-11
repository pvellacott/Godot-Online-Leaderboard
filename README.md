# Godot Online Leaderboard

Template for setting up a godot game with an online leaderboard. Backend is using lambda+dynamodb

Example of the leaderboard working on the HEAVILY WIP (just started) game @ browsergame.epicgames.nz

![leaderboard](https://github.com/user-attachments/assets/83ece5f7-25b2-4e1e-957d-46c6283d1f35)

## Some Setup Steps
1. Donwload this mf
2. Setup lamda function located in src/lambda/ *make sure to add IAM role for dynamodb access on the lambda function
3. Setup a dynamodb table. I used this format -
 - Table name: ranked_scores
 - Partition key: username (String)
 - Sort key: timestamp (Number)  
With GSI -  
- Partition key: leaderboard (String)
- Sort key: score (Number)
- Index name: leaderboard-score-index
4. Setup API Gateway (or use Function URLs)
5. Add your API url & private key, perhaps like this -> config/api_config.gd -> <code>const API_URL = "https://your-api-id.lambda-url.region.on.aws"</code>
