import mongoose from 'mongoose';

const SettingsSchema = new mongoose.Schema({
    userId: { type: String, default: 'default' },
    geminiKey: String,
    openAiKey: String,
    defaultModel: { type: String, default: 'gemini-2.5-flash' },
    globalVariables: { type: Map, of: String, default: {} }
}, { timestamps: true });

const DomainSchema = new mongoose.Schema({
    name: { type: String, required: true },
    variables: { type: Map, of: String, default: {} }
}, { timestamps: true });

const ChunkSchema = new mongoose.Schema({
    promptId: { type: mongoose.Schema.Types.ObjectId, ref: 'Prompt', required: true },
    title: String,
    content: String,
    order: Number,
    role: { type: String, enum: ['system', 'user', 'model'], default: 'user' },
    locked: { type: Boolean, default: false },
    enabled: { type: Boolean, default: true }
}, { timestamps: true });

const PromptSchema = new mongoose.Schema({
    domainId: { type: mongoose.Schema.Types.ObjectId, ref: 'Domain' },
    title: { type: String, required: true },
    description: String,
    tags: [String],
    version: { type: Number, default: 1 },
    variables: { type: Map, of: String, default: {} },
    chunkingLogic: String,
    todos: [{ 
        id: String,
        text: String,
        done: { type: Boolean, default: false },
        chunkId: String
    }]
}, { timestamps: true });

const VersionSchema = new mongoose.Schema({
    promptId: { type: mongoose.Schema.Types.ObjectId, ref: 'Prompt', required: true },
    versionNumber: Number,
    contentSnapshot: String, // Stringified array of chunks
}, { timestamps: true });

// Check if models are already compiled to avoid CompileError in Next.js hot reloading
export const Settings = (mongoose.models.Settings || mongoose.model('Settings', SettingsSchema)) as mongoose.Model<any>;
export const Domain = (mongoose.models.Domain || mongoose.model('Domain', DomainSchema)) as mongoose.Model<any>;
export const Chunk = (mongoose.models.Chunk || mongoose.model('Chunk', ChunkSchema)) as mongoose.Model<any>;
export const Prompt = (mongoose.models.Prompt || mongoose.model('Prompt', PromptSchema)) as mongoose.Model<any>;
export const Version = (mongoose.models.Version || mongoose.model('Version', VersionSchema)) as mongoose.Model<any>;
