module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/src/lib/mongodb.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getDb",
    ()=>getDb
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongodb__$5b$external$5d$__$28$mongodb$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongodb$29$__ = __turbopack_context__.i("[externals]/mongodb [external] (mongodb, cjs, [project]/node_modules/mongodb)");
;
let client = null;
let clientPromise = null;
function getMongoUri() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        // IMPORTANT: do NOT throw at module-eval time.
        // Next.js may evaluate route modules during build.
        throw new Error("Missing MONGODB_URI. Set it in Vercel Project Settings → Environment Variables.");
    }
    // Log the URI (with password masked) for debugging
    const maskedUri = uri.replace(/:[^:@]+@/, ":****@");
    console.log("[MongoDB] Connecting with URI:", maskedUri);
    return uri;
}
async function getClient() {
    const uri = getMongoUri();
    // Verify URI format before creating client
    if (!uri.includes('mongodb+srv://') && !uri.includes('mongodb://')) {
        throw new Error(`Invalid MongoDB URI format: ${uri.substring(0, 50)}...`);
    }
    // Check if password is properly encoded (should not contain unencoded @)
    const uriMatch = uri.match(/mongodb\+srv:\/\/[^:]+:([^@]+)@/);
    if (uriMatch && uriMatch[1].includes('@') && !uriMatch[1].includes('%40')) {
        throw new Error('MongoDB password contains unencoded @ character. Please URL-encode the password.');
    }
    if ("TURBOPACK compile-time truthy", 1) {
        // Always create a fresh connection in development to pick up env changes
        if (global._mongoClientPromise) {
            try {
                const oldClient = await global._mongoClientPromise;
                await oldClient.close();
            } catch (e) {
            // Ignore errors when closing old client
            }
        }
        client = new __TURBOPACK__imported__module__$5b$externals$5d2f$mongodb__$5b$external$5d$__$28$mongodb$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongodb$29$__["MongoClient"](uri);
        global._mongoClientPromise = client.connect();
        return global._mongoClientPromise;
    }
    //TURBOPACK unreachable
    ;
}
async function getDb() {
    const c = await getClient();
    return c.db(process.env.DB_NAME || undefined);
}
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[project]/src/lib/seed.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "RARITY_WEIGHT",
    ()=>RARITY_WEIGHT,
    "emptyEquipped",
    ()=>emptyEquipped,
    "seedInventory",
    ()=>seedInventory
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/crypto [external] (crypto, cjs)");
;
const RARITY_WEIGHT = {
    common: 1,
    epic: 2,
    legendary: 3
};
function item(slot, name, rarity, stat_bonus) {
    return {
        item_id: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["randomUUID"])(),
        slot,
        name,
        rarity,
        stat_bonus
    };
}
function seedInventory() {
    return [
        item("head", "Neural Visor Mk.I", "common", {
            intelligence: 1
        }),
        item("head", "Cyan Halo Helm", "epic", {
            mind: 2
        }),
        item("head", "Legend Crown Interface", "legendary", {
            intelligence: 3,
            mind: 2
        }),
        item("shoulders", "Reactive Pauldrons", "common", {
            vitality: 1
        }),
        item("shoulders", "Aegis Spines", "epic", {
            vitality: 2,
            strength: 1
        }),
        item("shoulders", "Singularity Mantle", "legendary", {
            vitality: 3,
            strength: 2
        }),
        item("chest", "Carbon Weave Core", "common", {
            vitality: 1,
            strength: 1
        }),
        item("chest", "Vector Plating", "epic", {
            vitality: 2,
            dexterity: 1
        }),
        item("chest", "Titanium Heart Engine", "legendary", {
            vitality: 4,
            strength: 2
        }),
        item("hands", "Servo Gloves", "common", {
            dexterity: 1
        }),
        item("hands", "Arc Gauntlets", "epic", {
            strength: 1,
            dexterity: 2
        }),
        item("hands", "Chrono Hands", "legendary", {
            dexterity: 3,
            intelligence: 1
        }),
        item("legs", "Kinetic Greaves", "common", {
            vitality: 1
        }),
        item("legs", "Stride Amplifiers", "epic", {
            dexterity: 2,
            vitality: 1
        }),
        item("legs", "Voidwalk Legs", "legendary", {
            dexterity: 3,
            mind: 1
        }),
        item("feet", "Mag Boots", "common", {
            dexterity: 1
        }),
        item("feet", "Phase Runners", "epic", {
            dexterity: 2,
            mind: 1
        }),
        item("feet", "Stellar Treads", "legendary", {
            dexterity: 3,
            vitality: 1
        }),
        item("main_hand", "Pulse Blade", "common", {
            strength: 1
        }),
        item("main_hand", "Rail Pistol", "epic", {
            dexterity: 1,
            strength: 2
        }),
        item("main_hand", "Cyan Edge Prototype", "legendary", {
            strength: 4
        }),
        item("off_hand", "Buckler Drone", "common", {
            vitality: 1
        }),
        item("off_hand", "Ion Shield", "epic", {
            vitality: 2,
            mind: 1
        }),
        item("off_hand", "Prismatic Barrier", "legendary", {
            vitality: 3,
            intelligence: 1,
            mind: 1
        })
    ];
}
function emptyEquipped() {
    return {
        head: null,
        shoulders: null,
        chest: null,
        hands: null,
        legs: null,
        feet: null,
        main_hand: null,
        off_hand: null
    };
}
}),
"[project]/src/app/api/profile/upsert/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST,
    "runtime",
    ()=>runtime
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mongodb$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/mongodb.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$seed$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/seed.ts [app-route] (ecmascript)");
;
;
;
const runtime = "nodejs";
async function POST(req) {
    try {
        const body = await req.json();
        const { discord_user_id, username, avatar } = body || {};
        if (!discord_user_id || !username) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "discord_user_id and username are required"
            }, {
                status: 400
            });
        }
        const db = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mongodb$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getDb"])();
        const profiles = db.collection("profiles");
        const now = new Date().toISOString();
        const existing = await profiles.findOne({
            discord_user_id
        });
        if (existing) {
            await profiles.updateOne({
                discord_user_id
            }, {
                $set: {
                    username,
                    avatar: avatar ?? null,
                    updated_at: now
                }
            });
            const updated = await profiles.findOne({
                discord_user_id
            }, {
                projection: {
                    _id: 0
                }
            });
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(updated);
        }
        const newProfile = {
            discord_user_id,
            username,
            avatar: avatar ?? null,
            created_at: now,
            updated_at: now,
            base_stats: {
                strength: 10,
                vitality: 10,
                dexterity: 10,
                intelligence: 10,
                mind: 10
            },
            inventory: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$seed$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["seedInventory"])(),
            equipped: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$seed$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["emptyEquipped"])()
        };
        await profiles.insertOne(newProfile);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(newProfile);
    } catch (error) {
        console.error("Profile upsert error:", error);
        const errorMessage = error instanceof Error ? error.message : "Internal server error";
        const errorStack = error instanceof Error ? error.stack : undefined;
        console.error("Error stack:", errorStack);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: errorMessage,
            details: errorStack
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__ebf4b715._.js.map