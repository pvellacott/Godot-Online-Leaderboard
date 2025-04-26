extends Control

signal back_pressed

@onready var score_list: ItemList = $VBoxContainer/ScoreList
@onready var refresh_button: Button = $VBoxContainer/HBoxContainer/RefreshButton
@onready var back_button: Button = $VBoxContainer/HBoxContainer/BackButton
@onready var http_request: HTTPRequest = $HTTPRequest


const API_CONFIG = preload("res://config/api_config.gd")


func _ready():
	refresh_button.pressed.connect(fetch_scores)
	back_button.pressed.connect(_on_back_pressed)
	http_request.request_completed.connect(_on_http_request_request_completed)
	fetch_scores() 

func fetch_scores():
	score_list.clear()
	score_list.add_item("Loading scores...")
	
	var error = http_request.request(API_CONFIG.API_URL)
	if error != OK:
		print("An error occurred in HTTP request: ", error)
		score_list.clear()
		score_list.add_item("Error fetching scores.")

func _on_http_request_request_completed(result: int, response_code: int, headers: PackedStringArray, body: PackedByteArray) -> void:
	score_list.clear()

	if response_code == 200:
		var json_data = JSON.parse_string(body.get_string_from_utf8())
		if typeof(json_data) == TYPE_DICTIONARY and json_data.has("topScores"):
			var scores_array = json_data.topScores
			update_leaderboard(scores_array)
		else:
			print("Error parsing JSON or unexpected format: ", json_data)
			score_list.add_item("Error parsing scores data.")
	else:
		print("Failed to fetch scores: ", response_code)
		var response_body = body.get_string_from_utf8()
		print("Response body: ", response_body)
		score_list.add_item("Failed to load scores: " % response_code)

func update_leaderboard(scores: Array):
	scores.sort_custom(func(a, b): return a.score > b.score)
	
	for item in scores:
		if item.has("username") and item.has("score"):
			score_list.add_item("%s: %d" % [item.username, item.score])
		else:
			print("Skipping invalid score entry: ", item)

func _on_back_pressed():
	back_pressed.emit()
