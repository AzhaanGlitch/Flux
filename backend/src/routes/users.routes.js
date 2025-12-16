import { Router } from "express";
import { addToHistory, getUserHistory, login, register, deleteMeeting, deleteAllMeetings } from "../controllers/user.controller.js";

const router = Router();

router.route("/login").post(login)
router.route("/register").post(register)
router.route("/add_to_activity").post(addToHistory)
router.route("/get_all_activity").get(getUserHistory)
router.route("/delete_meeting/:meetingCode").delete(deleteMeeting)
router.route("/delete_all_meetings").delete(deleteAllMeetings)

export default router;