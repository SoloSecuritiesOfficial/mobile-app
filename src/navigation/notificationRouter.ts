import { navigateTo } from "./navigationRef";

/**
 * Maps FCM notification actionUrl to the correct screen + params.
 *
 * actionUrl patterns sent by the backend:
 *   /chat/:userId
 *   /social/friend-requests
 *   /profile/:userId
 *   /quiz
 *   /quiz/:quizId
 *   /labs
 *   /labs/:labId
 *   /ctf
 *   /ctf/:challengeId      (not a dedicated screen yet — opens CTF list)
 *   /learning
 *   /learning/:moduleId
 *   /jobs
 *   /jobs/:jobId
 *   /certificates
 *   /security/cve
 *   /notifications
 *   /leaderboard
 *   /achievements
 *   /premium
 */
export function routeNotification(data: Record<string, string> | undefined) {
  if (!data) return;

  // Prefer actionUrl, fall back to type-based routing
  const url    = (data.actionUrl ?? "").trim();
  const type   = (data.type      ?? "").trim();
  const senderId       = data.senderId       ?? "";
  const senderUsername = data.senderUsername ?? data.username ?? "";
  const senderImage    = data.senderImage    ?? data.profileImage ?? "";

  // ── URL-based routing ────────────────────────────────────────
  if (url) {
    // /chat/:userId
    const chatMatch = url.match(/^\/chat\/([a-f0-9]{24})$/i);
    if (chatMatch) {
      navigateTo("Chat", {
        userId:       chatMatch[1],
        username:     senderUsername,
        profileImage: senderImage || undefined,
      });
      return;
    }

    // /profile/:userId  or  /friend/:userId
    const profileMatch = url.match(/^\/(profile|friend)\/([a-f0-9]{24})$/i);
    if (profileMatch) {
      navigateTo("FriendProfile", {
        userId:       profileMatch[2],
        username:     senderUsername,
        profileImage: senderImage || undefined,
      });
      return;
    }

    // /social/friend-requests
    if (url.startsWith("/social/friend")) {
      navigateTo("Friends");
      return;
    }

    // /quiz/:quizId
    const quizMatch = url.match(/^\/quiz\/([a-f0-9]{24})$/i);
    if (quizMatch) {
      navigateTo("QuizQuestion", { quizId: quizMatch[1] });
      return;
    }

    // /quiz (list)
    if (url === "/quiz") {
      navigateTo("Quiz");
      return;
    }

    // /labs/:labId
    const labMatch = url.match(/^\/labs\/([a-f0-9]{24})$/i);
    if (labMatch) {
      navigateTo("LabDetails", { id: labMatch[1] });
      return;
    }

    // /labs (list)
    if (url === "/labs") {
      navigateTo("Labs");
      return;
    }

    // /learning/:moduleId
    const learningMatch = url.match(/^\/learning\/([a-f0-9]{24})$/i);
    if (learningMatch) {
      navigateTo("LearningDetails", { id: learningMatch[1] });
      return;
    }

    // /learning (list)
    if (url === "/learning") {
      navigateTo("Learning");
      return;
    }

    // /jobs/:jobId
    const jobMatch = url.match(/^\/jobs\/([a-f0-9]{24})$/i);
    if (jobMatch) {
      navigateTo("JobDetails", { id: jobMatch[1] });
      return;
    }

    // /jobs (list)
    if (url === "/jobs") {
      navigateTo("Jobs");
      return;
    }

    // /certificates
    if (url.startsWith("/certificates")) {
      const certMatch = url.match(/^\/certificates\/([a-f0-9]{24})$/i);
      if (certMatch) {
        navigateTo("CertificateDetails", { id: certMatch[1] });
      } else {
        navigateTo("Certificates");
      }
      return;
    }

    // /security/cve
    if (url.startsWith("/security/cve") || url === "/cve") {
      navigateTo("CVEUpdates");
      return;
    }

    // /ctf
    if (url.startsWith("/ctf")) {
      navigateTo("CTF");
      return;
    }

    // /leaderboard
    if (url.startsWith("/leaderboard")) {
      navigateTo("Leaderboard");
      return;
    }

    // /achievements
    if (url.startsWith("/achievements")) {
      navigateTo("Achievements");
      return;
    }

    // /premium
    if (url.startsWith("/premium")) {
      navigateTo("Premium");
      return;
    }

    // /notifications
    if (url.startsWith("/notifications")) {
      navigateTo("Notifications");
      return;
    }
  }

  // ── Type-based fallback (when no actionUrl or unmatched) ─────
  switch (type) {
    case "chat_message":
      if (senderId) {
        navigateTo("Chat", {
          userId:       senderId,
          username:     senderUsername,
          profileImage: senderImage || undefined,
        });
      } else {
        navigateTo("ChatList");
      }
      break;

    case "friend_request":
    case "friend_accepted":
      navigateTo("Friends");
      break;

    case "new_quiz":
    case "daily_quiz":
      navigateTo("Quiz");
      break;

    case "new_lab":
      navigateTo("Labs");
      break;

    case "new_learning":
      navigateTo("Learning");
      break;

    case "new_ctf":
      navigateTo("CTF");
      break;

    case "new_job":
      navigateTo("Jobs");
      break;

    case "cve_alert":
      navigateTo("CVEUpdates");
      break;

    case "achievement":
      navigateTo("Achievements");
      break;

    case "leaderboard":
      navigateTo("Leaderboard");
      break;

    case "submission_graded":
    case "new_course":
      navigateTo("Learning");
      break;

    case "premium":
      navigateTo("Premium");
      break;

    case "certificate_issued":
      navigateTo("Certificates");
      break;

    default:
      navigateTo("Notifications");
      break;
  }
}
