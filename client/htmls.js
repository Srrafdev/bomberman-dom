export { waitingChattingPage };
import { vdm } from "./miniframework.js";
import { left_time, room } from "./app.js";


function chatting() {
    return vdm("div", { class: "chat-container" }, [
        vdm("div", { class: "chat-header" }, [
            vdm("h2", {}, ["Game Chat"]),
        ]),
        vdm("div", { class: "chat-messages" }, [
            vdm("div", { class: "message other-message" }, [
                vdm("div", { class: "message-sender" }, ["Player1"]),
                "Hello everyone! Ready to play?",
            ]),
            vdm("div", { class: "message user-message" }, [
                vdm("div", { class: "message-sender" }, ["You"]),
                "Hi! Yes, I'm ready to start the game.",
            ]),
            vdm("div", { class: "message other-message" }, [
                vdm("div", { class: "message-sender" }, ["Player1"]),
                "Great! We're just waiting for more players to join.",
            ]),
            vdm("div", { class: "message user-message" }, [
                vdm("div", { class: "message-sender" }, ["You"]),
                "No problem, I'll wait.",
            ]),
            vdm("div", { class: "message other-message" }, [
                vdm("div", { class: "message-sender" }, ["Player1"]),
                "Looks like it's just us for now. I'll start once we have at least one more player.",
            ]),
        ]),
        vdm("div", { class: "chat-input-container" }, [
            vdm("input", {
                type: "text",
                class: "chat-input",
                placeholder: "Type your message...",
            }),
            vdm("button", { class: "send-button" }, ["Send"]),
        ]),
    ]);
}

function waiting() {
    let players = room.players || []
    const maxPlayers = 4;
    const connectedPlayers = players.map((name) =>
        vdm("div", { class: "player-card" }, [
            vdm("div", { class: "player-avatar" }, []),
            vdm("div", { class: "player-info" }, [
                vdm("div", { class: "player-name" }, [name]),
                vdm("div", { class: "player-status online" }, ["Connected"]),
            ]),
        ])
    );

    const skeletonCount = maxPlayers - players.length;
    const skeletonPlayers = Array.from({ length: skeletonCount }).map(() =>
        vdm("div", { class: "player-card" }, [
            vdm("div", { class: "skeleton skeleton-avatar" }, []),
            vdm("div", { class: "player-info" }, [
                vdm("div", { class: "skeleton skeleton-text skeleton-text-short" }, []),
            ]),
        ])
    );

    return vdm("div", { class: "players-container" }, [
        vdm("h1", { class: "waiting-title" }, [`left Time ${left_time} Seconds`]),
        vdm("h1", { class: "waiting-title" }, [`Players (${players.length}/4)`]),
        vdm("div", { class: "players-list" }, [
            ...connectedPlayers,
            ...skeletonPlayers,
        ]),
    ]);
}

const waitingChattingPage = ()=>{
    return vdm("div", { class: "waiting-chatting-container" }, [
        waiting(),
        chatting(),
    ]);
}