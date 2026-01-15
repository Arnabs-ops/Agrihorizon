import { Doc, Id } from "../../convex/_generated/dataModel";
import { UserProfile } from "./user";

export interface ConversationWithDetails extends Doc<"conversations"> {
    otherParticipant: {
        user: Doc<"users"> | null;
        profile: Doc<"userProfiles"> | null;
    };
}

export interface MessageWithSender extends Doc<"messages"> {
    sender: {
        user: Doc<"users"> | null;
        profile: Doc<"userProfiles"> | null;
    };
}
