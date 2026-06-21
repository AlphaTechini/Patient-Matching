SIGN UP

I visited the website to create an account and claim the free tokens. The site mentions that decentralized identities are being created, but I noticed there are manual input fields for your first and last name. There is also a "Sign in with Google" button, which made me confused.

I expected that if there are fields for your name and email, then the Google button would handle those automatically. The permissions requested by the Google pop-up already give access to my first name, last name, and profile picture. I have implemented similar features in different projects, and you can definitely fetch that data automatically. It baffles me that I still have to manually input my name after signing in with Google.

If the concern was preventing users from using other email providers like Yahoo Mail instead of Gmail, you could easily use regex to reject any email address that isn't a Gmail address. If the concern was verifying a valid address, sending a code to the email would have addressed that issue.



FEATURE REQUEST

Also, there is no claim method to transfer test tokens. I wanted to create separate identities for my agents, but I ended up having to make them use my funded API key because they couldn't make transactions on the trusted execution environment due to lacking tokens or credits.

If there is a function that can enable me to easily fund my agents (perhaps even from my original balance), I would really appreciate that help. I guess the current setup simplifies the flow since they all use the same API key, but thinking about the future roadmap where there will be more complexity, it would be better for the agents to have their own credits. I'm just suggesting adding that to the architecture.

---

## TEE TRIAL PUBLISHING FAILURE (HTTP 500)

**Issue:** Cannot publish trials to TEE KV store - receiving HTTP 500 Internal Server Error from T3N platform.

**Error Details:**
```
HTTP 500: Internal error [request_id: ...]
{"code":"internal_error","request_id":"..."}
```

**What We Tried:**

1. **Contract Deployment** ✅
   - Contracts successfully deployed to testnet
   - Pharma contract ID: 366 (version 0.1.5)
   - Hospital contract ID: 367 (version 0.1.5)
   - `setup.ts` runs without errors

2. **KV Map Permissions** ✅
   - Updated trial-criteria map to allow both contract IDs (366, 367) write access
   - Permissions confirmed via setup.ts ACL updates
   - Map writers: [366, 367]
   - Map readers: [366, 367]

3. **Self-Authorization** ✅
   - Added self-authorization grant for T3N_API_KEY user
   - Granted permission to call pharma contract functions (publish-trial, get-trial-criteria, submit-match-result)
   - Granted permission to call hospital contract (check-eligibility)
   - Verification shows grant is active

4. **Contract Version** ✅
   - Updated all code to use version "0.1.5" (matches deployed contracts)
   - Removed dynamic version lookups that were returning stale versions

5. **Input Validation** ✅
   - Verified trial data structure matches contract expectations
   - Confirmed trial_id and criteria format are correct
   - Contract's publish-trial function exists and is exported

**Current Status:**
- HTTP 500 persists even after all fixes
- This appears to be a T3N platform internal issue, not our code
- Possible causes:
  - T3N testnet API experiencing issues
  - Contract execution errors on platform side
  - API key rate limits or resource constraints

**Workaround Implemented:**
- Agent matching now uses **backend eligibility checking** as fallback
- Created `eligibility-checker.ts` service that implements same logic as TEE contract
- Agents read trial criteria from MongoDB instead of TEE KV store
- All matching happens in backend Node.js process
- TEE code paths preserved for when platform recovers

**Impact:**
- ✅ Agent matching works via backend fallback
- ✅ All functionality operational
- ❌ Missing TEE privacy guarantees (matching visible to backend)
- ❌ Cannot demonstrate TEE execution in demo

**Next Steps:**
- Monitor T3N platform status
- Retry publishing when platform recovers
- TEE code will automatically be used when publish succeeds