SIGN UP

I visited the website to create an account and claim the free tokens. The site mentions that decentralized identities are being created, but I noticed there are manual input fields for your first and last name. There is also a "Sign in with Google" button, which made me confused.

I expected that if there are fields for your name and email, then the Google button would handle those automatically. The permissions requested by the Google pop-up already give access to my first name, last name, and profile picture. I have implemented similar features in different projects, and you can definitely fetch that data automatically. It baffles me that I still have to manually input my name after signing in with Google.

If the concern was preventing users from using other email providers like Yahoo Mail instead of Gmail, you could easily use regex to reject any email address that isn't a Gmail address. If the concern was verifying a valid address, sending a code to the email would have addressed that issue.



FEATURE REQUEST

Also, there is no claim method to transfer test tokens. I wanted to create separate identities for my agents, but I ended up having to make them use my funded API key because they couldn't make transactions on the trusted execution environment due to lacking tokens or credits.

If there is a function that can enable me to easily fund my agents (perhaps even from my original balance), I would really appreciate that help. I guess the current setup simplifies the flow since they all use the same API key, but thinking about the future roadmap where there will be more complexity, it would be better for the agents to have their own credits. I'm just suggesting adding that to the architecture.