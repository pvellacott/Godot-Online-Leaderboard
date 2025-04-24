class_name LoginScreen
extends Control

signal submitted(username)

@onready var username_input = $CenterContainer/VBoxContainer/UsernameInput
@onready var submit_button = $CenterContainer/VBoxContainer/SubmitButton


func _ready():
	submit_button.pressed.connect(_on_submit_pressed)

func _on_submit_pressed():
	var username = username_input.text
	if username.strip_edges().is_empty():
		print("Username cannot be empty!") 
		return
	submitted.emit(username)

# Clears Username
func _on_action_screen_done_pressed(counter: int) -> void:
	username_input.clear()
	pass 
