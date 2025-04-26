class_name ActionScreen
extends Control

signal done_pressed(score: int)

var counter: int = 0

@onready var welcome_label = $CenterContainer/VBoxContainer/WelcomeLabel
@onready var action_button = $CenterContainer/VBoxContainer/HBoxContainer/ActionButton
@onready var done_button = $CenterContainer/VBoxContainer/HBoxContainer/DoneButton


func _ready():
	action_button.pressed.connect(_on_action_pressed)
	done_button.pressed.connect(_on_done_pressed)

func _on_login_screen_submitted(username: Variant) -> void:
	welcome_label.text = "Welcome, " + username + "!"
	pass 

func _on_action_pressed():
	counter += 1
	print(counter)

func _on_done_pressed():
	done_pressed.emit(counter)
	counter = 0
