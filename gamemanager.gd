extends Node

@onready var login_screen = $LoginScreen
@onready var action_screen = $ActionScreen
@onready var http = $HTTPRequest



func _ready():
	# Ensure the action screen is hidden at the start
	action_screen.hide()
	login_screen.show()

# Scene Management
func _on_login_screen_submitted(username: Variant) -> void:
	print("Username entered: ", username) # Optional: Log the username
	login_screen.hide()
	action_screen.show()
	pass 

func _on_action_screen_done_pressed(counter: int) -> void:
	print("this is the final number ", counter)
	action_screen.hide()
	login_screen.show()
	pass 


func _on_http_request_request_completed(result: int, response_code: int, headers: PackedStringArray, body: PackedByteArray) -> void:
	pass # Replace with function body.
