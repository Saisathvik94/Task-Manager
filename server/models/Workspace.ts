import mongoose from "mongoose";

const WorkspaceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Workspace name is required"],
        trim: true,
        maxlength: [100, "Workspace name cannot exceed 100 characters"]
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    members: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true
            },
            role: {
                type: String,
                enum: ["OWNER", "MEMBER"],
                default: "MEMBER"
            }
        }
    ]
}, { timestamps: true });

// Add database index for fast workspace member lookups
WorkspaceSchema.index({ "members.user": 1 });

const Workspace = mongoose.model("Workspace", WorkspaceSchema);
export default Workspace;
