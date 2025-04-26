extends Node

@onready var login_screen = $LoginScreen
@onready var action_screen = $ActionScreen
@onready var leaderboard_screen = $Leaderboard
@onready var http = $HTTPRequest


const API_CONFIG = preload("res://config/api_config.gd")


func _ready():
	action_screen.hide()
	login_screen.show()
	print("API URL is: ", API_CONFIG.API_URL)

# Scene Management
func _on_login_screen_submitted(username: Variant):
	login_screen.hide()
	action_screen.show()
	return username

func _on_action_screen_done_pressed(score: int):
	print("this is the final number ", score)
	action_screen.hide()
	leaderboard_screen.show()
	return score
	
	
func _on_login_screen_lbutton() -> void:
	login_screen.hide()
	leaderboard_screen.show()
	pass
	
func _on_leaderboard_back_pressed() -> void:
	leaderboard_screen.hide()
	login_screen.show()
	pass 
