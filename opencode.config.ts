export default {
    mcp: {
        tools: [
            {
                name: "supabase",
                type: "http",
                baseUrl: process.env.SUPABASE_URL,
                headers: {
                    apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
                    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
                }
            },
            {
                name: "stripe",
                type: "http",
                baseUrl: "https://api.stripe.com/v1",
                headers: {
                    Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`
                }
            }
        ]
    }
}