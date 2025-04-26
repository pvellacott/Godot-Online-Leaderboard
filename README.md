# Godot Online Leaderboard

Template for setting up a godot game with an online leaderboard. Backend is using lambda+dynamodb


![leaderboard](https://github.com/user-attachments/assets/83ece5f7-25b2-4e1e-957d-46c6283d1f35)

## Some Steps
1. Donwload this mf
2. Setup lamda function located in src/lambda/
3. Setup a dynamodb table. I used this format -
 - Table name: ranked_scores
 - Partition key: username (String)
 - Sort key: timestamp (Number)  
With GSI -  
- Partition key: leaderboard (String)
- Sort key: score (Number)
- Index name: leaderboard-score-index
4. Setup API Gateway (or use Function URLs)
5. Add your API url, perhaps like this -> config/api_config.gd -> <code>const API_URL = "https://your-api-id.lambda-url.region.on.aws"</code>
