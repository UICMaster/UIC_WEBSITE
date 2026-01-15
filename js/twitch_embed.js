    new Twitch.Embed("twitch-embed", {
        width: "100%",
        height: 480, // Adjust height as needed to fit your design
        channel: "ultrainstinctcrew",
        layout: "video", // use "video-with-chat" if you want the chat included
        autoplay: true,
        muted: true, // Auto-play often requires starting muted
        parent: ["ultrainstinctcrew.com"] 
    });