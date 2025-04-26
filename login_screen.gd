class_name LoginScreen
extends Control

signal submitted(username)
signal lbutton

@onready var username_input = $CenterContainer/VBoxContainer/UsernameInput
@onready var submit_button = $CenterContainer/VBoxContainer/SubmitButton
@onready var leaderboard_button = $CenterContainer/VBoxContainer/LeaderboardButton

func _ready():
	
	submit_button.pressed.connect(_on_submit_pressed)
	leaderboard_button.pressed.connect(_on_leaderboard_pressed)

func _on_submit_pressed():
	var username = username_input.text
	if username.strip_edges().is_empty():
		print("Username cannot be empty!") 
		return
	submitted.emit(username)

# Clears Username
func _on_action_screen_done_pressed(score: int) -> void:
	username_input.clear()
	pass 

func _on_leaderboard_pressed():
	lbutton.emit()
	pass
