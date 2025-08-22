// src/i18n.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const I18nContext = createContext({ lang: "en", t: (k)=>k, setLang: ()=>{} });

const STRINGS = {
  en: {
    "settings.title": "Settings",
    "nav.viewProfile": "View Profile",
    "nav.editProfile": "Edit Profile",
    "nav.verify": "Verify Identity",
    "nav.pref": "Dating Preferences",
    "nav.plan": "Plan Subscription",
    "nav.boost": "Boost my Profile",
    "nav.boostActive": "Boost Active — until {time}",
    "nav.whatworks": "What Works",
    "nav.photoGuide": "Photo Guide",
    "nav.promptGuide": "Prompt Guide",
    "nav.matchingGuide": "Matching Guide",
    "nav.convGuide": "Conversation Guide",
    "nav.language": "Language",
    "nav.download": "Download",
    "nav.changePw": "Change Password",
    "nav.acctSecurity": "Account Security",
    "nav.logout": "Log out",
    "nav.delete": "Account Delete",
    "tip.fresh": "Tip: keep your profile info fresh for better matches.",
    "lang.english": "English",
   "lang.myanmar": "Myanmar",
   "boost.title": "Boost my Profile",
   "boost.desc": "🚀 Boost puts you on Users Of The Day for 24 hours and highlights your profile in Explore.",
   "boost.price": "Price",
   "boost.balance": "Your balance",
   "boost.notEnough": "Not enough coins. Get more coins on the Pricing page.",
   "boost.processing": "Processing…",
"boost.button": "Boost for {price}",
"pricing.titleWindow": "MyanMatch Membership",

"pricing.ribbon": "Membership",
"pricing.title": "Upgrade your MyanMatch experience",
"pricing.subtitle": "Coins-based {days}-day plans",
"pricing.subtitlePromo": "with limited-time 50% promo.",
"pricing.currentBalance": "Current balance",
"pricing.currentPlan": "Current plan",
"pricing.expiresOn": "Expires on",
"pricing.expired": "Plan expired — renew to continue benefits.",
"pricing.refundNote": "For your transaction safety: if something goes wrong and you don’t receive your benefits, we’ll return your coins.",
"pricing.badge50": "50% OFF • Limited time",
"pricing.perDays": "/ {days} days",
"pricing.plusDesc": "30-day access. More visibility, better control.",
"pricing.xDesc": "30-day full power for serious matching.",
"pricing.upgradeFromPlus": "Upgrade from Plus",
"pricing.noteOnX": "You’re on MyanMatchX (higher tier).",
"pricing.managePref": "Manage Dating Preferences",
"pricing.msg.signInFirst": "Please sign in first.",
"pricing.msg.notEnough": "Not enough coins. Need {need} (you have {have}).",
"pricing.msg.nowPlus": "🎉 You’re now MyanMatch+ for {days} days (until {date}).",
"pricing.msg.nowX": "🚀 Welcome to MyanMatchX for {days} days (until {date}).",
"pricing.msg.somethingWrong": "Something went wrong.",
"pricing.btn.alreadyX": "Already on X",
"pricing.btn.renewPlus": "Renew MyanMatch+ – {price}",
"pricing.btn.getPlus": "Get MyanMatch+ – {price}",
"pricing.btn.renewX": "Renew MyanMatchX – {price}",
"pricing.btn.upgradeToX": "Upgrade to X – {price}",
"pricing.btn.getX": "Get MyanMatchX – {price}",

"pricing.b.plus.swaps50": "Swap up to 50 matches daily",
"pricing.b.common.seeLikes": "See who liked me",
"pricing.b.x.unlimitedSwaps": "Unlimited swaps",
"pricing.b.x.advancedPref": "Advanced Dating Preferences (unlock all filters)",
"pricing.b.x.boost1day": "1-Day Boost on Users of the Day (Explore)",
"pricing.b.x.undo5": "Undo swap 5 times",

"pricing.btn.alreadyActiveUntil": "Already active — until {date}",
"pricing.msg.xAlreadyActive": "MyanMatchX is already active until {date}.",
"pricing.msg.boostActivated": "🚀 Boost activated on Explore for 24 hours.",

// --- Verify page ---
"verify.title": "Verify your identity",
"verify.subtitle": "Quick two-selfie check so everyone feels safe on MyanMatch.",
"verify.kycStatus": "KYC status",
"verify.loading": "loading…",
"verify.verified": "✔ Verified",
"verify.addAvatar": "Add avatar to continue",
"verify.badgeNote": "Changing your primary photo removes the blue badge until you re-verify.",
"verify.selfieA": "Selfie A",
"verify.selfieB": "Selfie B",
"verify.tapToTake": "Tap to take or upload selfie",
"verify.remove": "Remove",
"verify.warn.identical": "It looks like both selfies are identical. Please retake one with a different pose.",
"verify.btn.submit": "Submit for review",
"verify.btn.submitting": "Submitting…",
"verify.btn.pending": "Pending review…",
"verify.tip": "Tip: good lighting + clear face = faster approval.",
"verify.list.noCover": "No sunglasses, masks, or heavy filters.",
"verify.list.frontCam": "Use your front camera and follow the prompts.",
"verify.list.useOnly": "We only use these images for verification and then archive them securely.",
"verify.msg.submitted": "Submitted! We’ll review shortly. Your badge appears after approval.",
"verify.err.signInFirst": "Please sign in first.",
"verify.err.needBoth": "Please add both selfies.",
"verify.err.identical": "Selfie A and Selfie B look identical. Please take two different ones.",
"verify.err.generic": "Submission failed. Try again soon.",
"verify.denied.title": "Verification Denied",
"verify.denied.default": "Your identity check was denied. Please try again with clearer photos.",
"verify.denied.ok": "Got it",
"verify.alt.avatar": "Your avatar",
"verify.alt.example": "Example: {prompt}",
"verify.samplePrefix": "Example • {prompt}",

// Prompt labels
"verify.p.bigSmile": "Big smile 😄",
"verify.p.peaceSign": "Peace sign ✌️",
"verify.p.thumbsUp": "Thumbs up 👍",
"verify.p.turnRight": "Turn your head to the right ➡️",
"verify.p.touchNose": "Touch your nose 👃",
"verify.p.holdThree": "Hold up three fingers 🖐️(3)",
"verify.p.lookUpEyes": "Look up with eyes only 👀",

// src/i18n.jsx  (append into STRINGS.en)
"market.coins": "Coins",
"market.coinsLower": "coins",
"market.refresh": "Refresh",
"market.pending": "Pending {type}",
"market.type.deposit": "deposit",
"market.type.withdraw": "withdraw",
"market.action.deposit": "Deposit",
"market.action.withdraw": "Withdraw",
"market.action.history": "History",
"market.action.guide": "Guide",
"market.tab.buy": "Buy Gifts",
"market.tab.sell": "Sell Gifts",
"market.giftStore": "Gift Store",
"market.searchGifts": "Search gifts…",
"market.noGifts": "No gifts available.",
"market.buy.buy": "Buy",
"market.buy.buying": "Buying…",

"market.sell.myGifts": "My Gifts",
"market.sell.noGifts": "No gifts to sell.",
"market.sell.perEach": "/ each",
"market.sell.sell": "Sell",
"market.sell.selling": "Selling…",
"market.sell.receivePer": "You’ll receive {amount} coins per item.",
"market.sell.total": "Total:",
"market.common.cancel": "Cancel",
"market.common.confirm": "Confirm",

"market.deposit.title": "Deposit ({rate})",
"market.deposit.account": "Account",
"market.deposit.noAddress": "No/Address",
"market.deposit.copy": "Copy",
"market.deposit.txRefPlaceholder": "Transaction ID / Reference (optional)",
"market.deposit.noTxRef": "I don’t have a transaction ID",
"market.deposit.refundBox": "If something goes wrong and you don’t receive coins, we’ll refund your payment.",
"market.deposit.uploadLabel": "Upload screenshot",
"market.deposit.submit": "Submit Deposit Proof",
"market.deposit.submitting": "Submitting…",
"market.deposit.msgSubmitted": "Thanks! Proof submitted. We’ll credit coins after review.",
"market.deposit.msgError": "Upload failed. Please try again.",
"market.deposit.chooseMethod": "Choose a payment method.",
"market.deposit.uploadScreenshotFirst": "Upload your payment screenshot.",
"market.deposit.footerNote": "Upload the screenshot + Tx ID after transfer. Admin reviews and credits coins.",

"market.withdraw.title": "Withdraw Coins",
"market.withdraw.namePlaceholder": "Payout account name",
"market.withdraw.noPlaceholder": "Payout account number / wallet address",
"market.withdraw.amountPlaceholder": "Amount (min {min}, max {max})",
"market.withdraw.ruleText": "Minimum withdraw: {min} coins. You must keep at least {keep} coins in your balance.",
"market.withdraw.request": "Request Withdraw",
"market.withdraw.footer": "Withdrawals are manual and reviewed by admin. No extra fee.",
"market.withdraw.chooseMethod": "Choose a payout method.",
"market.withdraw.enterName": "Enter account name.",
"market.withdraw.enterNo": "Enter account number / address.",
"market.withdraw.minAmount": "Minimum withdraw amount is {min} coins.",
"market.withdraw.maxAmount": "You can withdraw up to {max} coins. You must keep {keep} coins in your balance.",
"market.withdraw.createFailed": "Failed to create request.",
"market.withdraw.msgQueued": "Request queued. You’ll get a notification once processed.",

"market.history.title": "Transaction History",
"market.history.empty": "No transaction yet.",
"market.history.bought": "Bought",
"market.history.sold": "Sold",
"market.history.deposit": "Deposit",
"market.history.withdraw": "Withdraw",

"market.guide.title": "What Works",
"market.guide.item1": "Top up coins to buy gifts and boost attention.",
"market.guide.item2": "Sell gifts later (80% return) to recover coins.",
"market.guide.item3": "Use Buy/Sell tabs for inventory management—sell one or sell all quickly.",
"market.guide.item4": "History tracks deposits, withdrawals, buys and sells.",
"market.guide.item5": "Need help? Contact support anytime.",

"market.msg.signInAgain": "Please sign in again.",
"market.msg.notEnoughCoins": "Not enough coins.",
"market.err.deductFailed": "Failed to deduct coins.",
"market.err.addGiftFailed": "Failed to add gift.",
"market.err.buyError": "Error buying gift.",
"chat.newMatches": "New Matches",
"chat.recent": "Most Recent {heart}",

"matches.header": "Likes You",
"matches.upgrade": "Upgrade",
"matches.onboarding.title": "See who likes you",
"matches.onboarding.desc": "You choose whether to connect with the people that like you.",
"matches.onboarding.gotit": "Got it",
"matches.empty.title": "You're new here! No likes yet.",
"matches.empty.desc": "Boost your profile to appear at the top and get more attention.",
"matches.empty.tryBoost": "Try Boost",
"matches.locked": "Upgrade to view",
"matches.upgradeBar": "With MyanMatch Plus/X, see who liked you",
"matches.modal.title": "It’s a Match!",
"matches.modal.desc": "You and {name} like each other. Start chatting now.",
"matches.modal.sayhi": "Say Hi🌸",
"matches.modal.keep": "Keep browsing",
"matches.upgradeBar.btn": "Upgrade",

// Explore
"explore.ribbon": "Users of the Day",
"explore.title": "Today’s Boosted Profiles",
"explore.subtitle": "Handpicked standouts boosted to the top. Send a gift to make a memorable first impression.",
"explore.boostMe": "Boost Me",
"explore.boosted": "Boosted",
"explore.card.gift": "Gift",
"explore.banner.error": "Could not load boosted profiles.",
"explore.empty.ribbon": "No boosted users right now",
"explore.empty.title": "Be the first to shine today",
"explore.empty.desc": "Boost your profile to get premium placement here and more views.",

// Gift modal
"gift.title": "Send a Gift",
"gift.loading": "Loading your gifts…",
"gift.empty": "You don’t have any gifts. Go to Market to buy.",
"gift.commentPH": "Add a comment (optional)",
"gift.cancel": "Cancel",
"gift.sending": "Sending…",
"gift.send": "Send Gift",
"gift.error": "Could not send gift. Please try again.",

// Home + Report (append)
"home.verified": "Verified",
"home.loading": "Loading profiles…",
"home.empty.ribbon": "You're all caught up",
"home.empty.title": "No more profiles for now",
"home.empty.desc": "Check back later or boost your profile to get more visibility and fresh connections.",
"home.noname": "No Name",
"home.voicePrompt": "Voice Prompt",
"home.dailyLimit": "Daily limit reached. Come back tomorrow or upgrade.",
"home.err.pass": "Couldn't record your pass.",
"home.err.like": "Couldn't record your like.",
"home.btn.pass": "Pass",
"home.btn.gift": "Send gift",
"home.btn.giftTitle": "Send Gift (Superlike)",
"home.btn.like": "Like",

"report.title": "REPORT",
"report.subtitle": "Help us keep MyanMatch safe",
"report.r1": "This profile is fake",
"report.r2": "This profile uses a celebrity / someone I know",
"report.r3": "Harassment or inappropriate content",
"report.r4": "Spam / scam behavior",
"report.extraLabel": "Extra details (optional)",
"report.extraPH": "Add any context or evidence…",
"report.submit": "Submit report",
"report.sending": "Sending…",
"report.err.login": "Please login again.",
"report.err.generic": "Couldn't send report. Please try again.",
"report.toast.ok": "Thanks—your report has been sent.",
"report.toast.err": "Something went wrong.",

// UserProfile page
"profile.loading": "Loading profile…",
"profile.oops": "Oops",
"profile.notfound": "Profile not found.",
"profile.goBack": "Go Back",
"profile.edit": "Edit Profile",
"profile.likeSent": "Like sent!",
"profile.superSent": "Superlike sent!",

// DeleteAccount
"delete.title": "Delete account",
"delete.permanent1": "This action is",
"delete.permanent2": "permanent",
"delete.permanent3": "and cannot be undone.",
"delete.readFirst.title": "Read before continuing",
"delete.readFirst.body": "Deleting your account removes your profile, messages, likes, gifts, boosts, and all other data from MyanMatch. There is no way to recover it later.",
"delete.emailLabel": "Your email",
"delete.emailPH": "you@example.com",
"delete.passwordLabel": "Password",
"delete.passwordPH": "Enter your password",
"delete.showPwd": "Show password",
"delete.hidePwd": "Hide password",
"delete.confirm": "I understand my account and all data will be permanently deleted.",
"delete.err.default": "Failed to delete account.",
"delete.err.generic": "Something went wrong.",
"delete.submit": "Permanently delete account",
"delete.submitting": "Deleting…",
"delete.cancel": "Never mind, take me back",
"delete.done.title": "Account deleted",
"delete.done.body": "We’ve removed your account and all associated data.",
"delete.done.redirecting": "Redirecting…",

// ChangePassword
"chpw.back": "Back",
"chpw.signedInAs": "Signed in as",
"chpw.currentLabel": "Current password",
"chpw.newLabel": "New password",
"chpw.confirmLabel": "Confirm new password",
"chpw.hint": "At least 8 characters, include letters and numbers.",
"chpw.msg.enterCurrent": "Enter your current password.",
"chpw.err.minLen": "Password must be at least 8 characters.",
"chpw.err.mix": "Use letters and numbers.",
"chpw.err.mismatch": "Passwords do not match.",
"chpw.err.notSignedIn": "Not signed in. Please log in again.",
"chpw.err.changeFailed": "Failed to change password.",
"chpw.err.tryAgain": "Failed to change password. Try again.",
"chpw.success": "✅ Password updated.",
"chpw.btn.submit": "Change Password",
"chpw.btn.submitting": "Updating…",

// Birthdate page
"dob.title": "What's your date of birth?",
"dob.confirmTitle": "Please confirm your info",
"dob.age": "{age}",
"dob.born": "Born {date}",
"dob.edit": "Edit",
"dob.confirm": "Confirm",
"dob.nextAria": "Next",

// Children page
"children.title": "What about children?",
"children.nextAria": "Next",
"children.opt.none": "Don't have children",
"children.opt.have": "Have children",
"children.opt.dog": "Have dog",
"children.opt.cat": "Have cat",
"children.opt.pet": "Have pet",
"children.opt.na": "Prefer not to say",

// Drinking page
"drink.title": "Do you drink?",
"drink.nextAria": "Next",
"drink.opt.yes": "Yes",
"drink.opt.sometimes": "Sometimes",
"drink.opt.no": "No",
"drink.opt.na": "Prefer not to say",

// Drugs page
"drugs.title": "Do you use drugs?",
"drugs.nextAria": "Next",
"drugs.opt.yes": "Yes",
"drugs.opt.sometimes": "Sometimes",
"drugs.opt.no": "No",
"drugs.opt.na": "Prefer not to say",

// Education level page
"edu.title": "What's the highest level you attained?",
"edu.nextAria": "Next",
"edu.opt.highschool": "High School",
"edu.opt.undergrad": "Undergrad",
"edu.opt.postgrad": "Postgrad",
"edu.opt.na": "Prefer not to say",

// Ethnicity page
"eth.title": "What's your ethnicity?",
"eth.whyPrefix": "Wondering why we ask this?",
"eth.learnMore": "Learn more.",
"eth.nextAria": "Next",

"eth.opt.bamar": "Bamar",
"eth.opt.karen": "Karen (Kayin)",
"eth.opt.shan": "Shan",
"eth.opt.kachin": "Kachin",
"eth.opt.mon": "Mon",
"eth.opt.chin": "Chin",
"eth.opt.rakhine": "Rakhine (Arakanese)",
"eth.opt.kayah": "Kayah (Karenni)",
"eth.opt.mmOther": "Other Myanmar Ethnic",
"eth.opt.chinese": "Chinese",
"eth.opt.indian": "Indian",
"eth.opt.african": "Black/African Descent",
"eth.opt.eastAsian": "East Asian",
"eth.opt.southAsian": "South Asian",
"eth.opt.hispanic": "Hispanic/Latino",
"eth.opt.mideast": "Middle Eastern",
"eth.opt.native": "Native American",
"eth.opt.pacific": "Pacific Islander",
"eth.opt.white": "White/Caucasian",
"eth.opt.other": "Other",

// Family plans page
"fam.title": "What are your family plans?",
"fam.nextAria": "Next",
"fam.opt.dont": "Don't want children",
"fam.opt.want": "Want children",
"fam.opt.open": "Open to children",
"fam.opt.unsure": "Not sure yet",
"fam.opt.na": "Prefer not to say",

// Gender page
"gender.title": "Which gender best describes you?",
"gender.subtitle": "MyanMatch matches are grouped by these three genders. You can add more about your gender later.",
"gender.learnMore": "Learn more",
"gender.learnTail": "about how we use gender to recommend people.",
"gender.nextAria": "Next",
"gender.opt.man": "Man",
"gender.opt.woman": "Woman",
"gender.opt.nonbinary": "Nonbinary",

// Hometown page
"hometown.title": "Where’s your hometown?",
"hometown.placeholder": "Enter your hometown",
"hometown.nextAria": "Next",

// Intention page
"intent.title": "What is your dating intention?",
"intent.nextAria": "Next",
"intent.opt.lifePartner": "Life partner",
"intent.opt.long": "Long-term relationship",
"intent.opt.longOpenShort": "Long-term relationship, open to short",
"intent.opt.shortOpenLong": "Short-term relationship, open to long",
"intent.opt.short": "Short-term relationship",
"intent.opt.figuring": "Figuring out my dating goals",
"intent.opt.na": "Prefer not to say",

// Interested-in page
"interested.title": "Who would you like to date?",
"interested.subtitle": "Select all who you're open to meeting",
"interested.nextAria": "Next",
"interested.opt.men": "Men",
"interested.opt.women": "Women",
"interested.opt.nb": "Nonbinary people",
"interested.opt.everyone": "Everyone",

// Job title page
"job.title": "What’s your job title?",
"job.placeholder": "Enter your job title",
"job.nextAria": "Next",

// Common
"common.ok": "OK",
"common.retry": "Retry",

// Location page
"loc.title": "Where do you live?",
"loc.subtitle": "Only your city/township name is shown to others.",
"loc.inputPH": "Press the button below to detect",
"loc.btn.use": "Use my current location",
"loc.btn.loading": "Detecting…",
"loc.nextAria": "Next",

// Location popups
"loc.pop.unsupported.title": "Geolocation not supported",
"loc.pop.unsupported.msg": "Your browser doesn’t support location. Please update your browser or enable it in settings.",
"loc.pop.nocity.title": "City not found",
"loc.pop.nocity.msg": "We couldn’t detect your city/township. Please try again.",
"loc.pop.fetch.title": "Unable to retrieve location",
"loc.pop.fetch.msg": "Check your internet connection and allow location access, then try again.",
"loc.pop.blocked.title": "Location blocked",
"loc.pop.blocked.denied": "Permission denied. Please allow location access in your browser settings.",
"loc.pop.blocked.generic": "We couldn’t get your GPS position. Please try again.",

// Name page
"name.title": "What’s your name?",
"name.firstPH": "First name",
"name.lastPH": "Last name",
"name.note": "Last name is optional, and only shared with matches.",
"name.why": "Why?",
"name.alwaysVisible": "Always visible on profile",
"name.nextAria": "Next",

// --- Onboarding Media page ---
"media.title": "Add your videos and photos",
"media.subtitle": "Add 6 photos or videos for your profile gallery.",
"media.subtitleNote": "More real moments = better matches!",
"media.uploading": "Uploading…",
"media.add": "Add",
"media.remove": "Remove",
"media.requiredNote": "Tap to add or edit. {count} uploads required to continue.",
"media.tip": "Not sure what to upload?",
"media.tipLink": "See profile photo tips",
"media.nextAria": "Next",
"media.err.signInFirst": "Please log in to upload media.",
"media.err.signInAgain": "User not logged in! Please log in again.",
"media.err.uploadFailed": "Upload failed",

// Political Belief page
"pol.title": "What are your political beliefs?",
"pol.nextAria": "Next",
"pol.opt.liberal": "Liberal",
"pol.opt.moderate": "Moderate",
"pol.opt.conservative": "Conservative",
"pol.opt.notPolitical": "Not Political",
"pol.opt.other": "Other",
"pol.opt.na": "Prefer not to say",

// Profile Prompts page
"prompts.step": "Step {cur}/{total}",
"prompts.title": "Write your profile answers",
"prompts.subtitle": "Choose prompts and show your personality!",
"prompts.selectPrompt": "Select a Prompt",
"prompts.answerPH": "Write your own answer...",
"prompts.chooseFirstPH": "Choose a prompt first",
"prompts.required3": "3 answers required",
"prompts.nextAria": "Next",
"prompts.modal.title": "Pick a Profile Prompt",

// Prompt pool
"prompts.pool.rant": "A quick rant about",
"prompts.pool.keyToHeart": "The key to my heart is",
"prompts.pool.setupPunchline": " If you get my attention then I'll give you the hints:",
"prompts.pool.unusualSkills": "Unusual skills",
"prompts.pool.kindestThing": "The kindest thing someone has ever done for me",
"prompts.pool.nonNegotiable": "Something that's non-negotiable for me is",
"prompts.pool.changeMyMind": "Change my mind about",
"prompts.pool.lastHappyTears": "The last time I cried happy tears was",
"prompts.pool.cryInCarSong": "My song while riding car is",
"prompts.pool.happyPlace": "My happy place",
"prompts.pool.whereIGoMyself": "Where I go when I want to feel a little more like myself",
"prompts.pool.bffWhyDateMe": "My BFF's take on why you should date me",
"prompts.pool.irrationalFear": "My irrational fear is",
"prompts.pool.comfortFood": "My go-to comfort food",
"prompts.pool.mostSpontaneous": "The most spontaneous thing I’ve done",
"prompts.pool.socialCause": "A social cause I care about",
"prompts.pool.factSurprises": "A fact about me that surprises people",
"prompts.pool.hobbyRecent": "A hobby I picked up recently",
"prompts.pool.dinnerWithAnyone": "If I could have dinner with anyone...",
"prompts.pool.knownFor": "I'm known for",
"prompts.pool.wishLanguage": "A language I wish I could speak",
"prompts.pool.repeatMovie": "The movie I can watch on repeat",
"prompts.pool.lifeSong": "Song that describes my life",
"prompts.pool.adventurousPlace": "The most adventurous place I’ve visited",
"prompts.pool.mostUsedApp": "The most used app on my phone",

// Religion page
"rel.title": "What are your religious beliefs?",
"rel.nextAria": "Next",
"rel.opt.agnostic": "Agnostic",
"rel.opt.atheist": "Atheist",
"rel.opt.buddhist": "Buddhist",
"rel.opt.catholic": "Catholic",
"rel.opt.christian": "Christian",
"rel.opt.hindu": "Hindu",
"rel.opt.jewish": "Jewish",
"rel.opt.deity": "Deity",
"rel.opt.muslim": "Muslim",

// School page
"school.title": "Where did you go to school?",
"school.inputPH": "School name",
"school.add": "Add another school",
"school.removeAria": "Remove school",
"school.nextAria": "Next",

// Sexuality page
"sex.title": "What's your sexuality?",
"sex.feedback": "Feedback on sexuality?",
"sex.nextAria": "Next",
"sex.opt.na": "Prefer not to say",
"sex.opt.straight": "Straight",
"sex.opt.gay": "Gay",
"sex.opt.lesbian": "Lesbian",
"sex.opt.bisexual": "Bisexual",
"sex.opt.allosexual": "Allosexual",
"sex.opt.androsexual": "Androsexual",

// Smoking page
"smoke.title": "Do you smoke tobacco?",
"smoke.nextAria": "Next",
"smoke.opt.yes": "Yes",
"smoke.opt.sometimes": "Sometimes",
"smoke.opt.no": "No",
"smoke.opt.na": "Prefer not to say",

// Voice Prompt page
"vp.step": "Step {cur}/{total}",
"vp.title": "Add a Voice Prompt to your profile",
"vp.pickTitle": "Pick a Voice Prompt",
"vp.loading": "Loading…",
"vp.ready": "Ready. You can save or re‑record.",
"vp.rerecord": "Re‑record",
"vp.tapStop": "Tap to stop",
"vp.tapStart": "Tap to start recording",
"vp.skip": "Skip",
"vp.nextAria": "Next",
"vp.err.unsupported": "Recording is not supported on this device/browser.",
"vp.err.permission": "Microphone permission denied or not available.",

// Voice prompt pool
"vp.pool.rant": "I won't shut up about",
"vp.pool.favMemory": "My favorite memory is",
"vp.pool.lastBigLaugh": "The last time I laughed hard was",
"vp.pool.bestAdvice": "The best advice I’ve ever received",
"vp.pool.hiddenTalent": "My hidden talent is",
"vp.pool.perfectWeekend": "My perfect weekend looks like",
"vp.pool.desertIsland": "What I’d bring to a desert island",
"vp.pool.superpower": "If I could have any superpower",
"vp.pool.makesMeSmile": "What makes me smile",
"vp.pool.funFact": "A fun fact about me",

// Weed page
"weed.title": "Do you smoke weed?",
"weed.nextAria": "Next",
"weed.opt.yes": "Yes",
"weed.opt.sometimes": "Sometimes",
"weed.opt.no": "No",
"weed.opt.na": "Prefer not to say",

// Work page
"work.title": "Where do you work?",
"work.placeholder": "Enter your workplace",
"work.nextAria": "Next",

// Account & Security
"acct.title": "Account & Security",
"acct.common.current": "Current:",
"acct.common.notSet": "not set",
"acct.common.sending": "Sending...",
"acct.common.verifying": "Verifying...",
"acct.common.err.start": "Failed to start change.",
"acct.common.err.confirm": "Failed to confirm.",
"acct.common.err.network": "Network error.",
"acct.common.ph.confirmPwd": "Confirm password",
"acct.common.ph.code6": "6-digit code",

// Email
"acct.email.title": "Email",
"acct.email.ph.new": "New email",
"acct.email.cta.send": "Send code to new email",
"acct.email.cta.confirm": "Confirm email change",
"acct.email.err.enterNewAndPwd": "Enter new email and password.",
"acct.email.err.enterCodeAndPwd": "Enter code and password.",
"acct.email.msg.codeSent": "Code sent to new email.",
"acct.email.msg.updated": "Email updated.",

// Phone
"acct.phone.title": "Phone",
"acct.phone.ph.newMm": "New Myanmar phone (e.g., 09xxxxxxxxx)",
"acct.phone.cta.send": "Send code to new phone",
"acct.phone.cta.confirm": "Confirm phone change",
"acct.phone.err.enterNewAndPwd": "Enter new phone and password.",
"acct.phone.err.enterCodeAndPwd": "Enter code and password.",
"acct.phone.msg.codeSent": "Code sent to new phone.",
"acct.phone.msg.updated": "Phone updated.",

// === Dating Preferences (en) ===
"settings.label": "Settings",

"prefs.title": "Dating Preferences",
"prefs.quickfill": "Quick‑fill from My Profile",
"prefs.ageRange": "Age range",
"prefs.min": "Min",
"prefs.max": "Max",
"prefs.showMe": "Show me",
"prefs.distance": "Distance",
"prefs.km": "km",
"prefs.relationship": "Relationship goals",
"prefs.educationOpt": "Education level (optional)",
"prefs.ethnicityOpt": "Ethnicity (optional)",
"prefs.habits": "Habits",
"prefs.smoking": "Smoking",
"prefs.drinking": "Drinking",
"prefs.weed": "Weed",
"prefs.drugs": "Drugs",
"prefs.religionOpt": "Religion (optional)",
"prefs.politicsOpt": "Politics (optional)",
"prefs.familyPlansOpt": "Family plans (optional)",
"prefs.quality": "Quality",
"prefs.verifiedOnly": "Verified profiles only",
"prefs.hasVoice": "Has voice prompt",
"prefs.savePrefs": "Save Preferences",

"prefs.lock.title": "MyanMatchX required",
"prefs.lock.desc": "Unlock advanced filters like distance, habits, religion, politics, family plans, and more.",
"prefs.lock.cta": "Upgrade to X",

"prefs.err.ageRange": "Min age must be ≤ Max age",

"prefs.toast.prefilled": "Prefilled ✓",
"prefs.toast.saved": "Saved ✓",
"prefs.toast.saveFail": "Couldn't save",

// commons used by DP
"common.back": "Back",
"common.save": "Save",
"common.saving": "Saving…",
"auth.signInFirst": "Please sign in first.",

// --- Display labels for options (en) ---
// genders
"prefs.opt.gender.man": "Man",
"prefs.opt.gender.woman": "Woman",
"prefs.opt.gender.nonbinary": "Nonbinary",

// relationship (slugged)
"prefs.opt.relationship.life_partner": "Life partner",
"prefs.opt.relationship.long_term_relationship": "Long-term relationship",
"prefs.opt.relationship.long_term_relationship_open_to_short": "Long-term relationship, open to short",
"prefs.opt.relationship.short_term_relationship_open_to_long": "Short-term relationship, open to long",
"prefs.opt.relationship.short_term_relationship": "Short-term relationship",
"prefs.opt.relationship.friendship": "Friendship",
"prefs.opt.relationship.figuring_out_my_dating_goals": "Figuring out my dating goals",
"prefs.opt.relationship.prefer_not_to_say": "Prefer not to say",

// religion
"prefs.opt.religion.agnostic": "Agnostic",
"prefs.opt.religion.atheist": "Atheist",
"prefs.opt.religion.buddhist": "Buddhist",
"prefs.opt.religion.catholic": "Catholic",
"prefs.opt.religion.christian": "Christian",
"prefs.opt.religion.hindu": "Hindu",
"prefs.opt.religion.jewish": "Jewish",
"prefs.opt.religion.deity": "Deity",
"prefs.opt.religion.muslim": "Muslim",

// politics
"prefs.opt.politics.liberal": "Liberal",
"prefs.opt.politics.moderate": "Moderate",
"prefs.opt.politics.conservative": "Conservative",
"prefs.opt.politics.not_political": "Not Political",
"prefs.opt.politics.other": "Other",
"prefs.opt.politics.prefer_not_to_say": "Prefer not to say",

// family plans
"prefs.opt.family.don_t_want_children": "Don't want children",
"prefs.opt.family.want_children": "Want children",
"prefs.opt.family.open_to_children": "Open to children",
"prefs.opt.family.not_sure_yet": "Not sure yet",
"prefs.opt.family.prefer_not_to_say": "Prefer not to say",

// ethnicity (slug matches your slug() helper)
"prefs.opt.ethnicity.bamar": "Bamar",
"prefs.opt.ethnicity.karen_kayin": "Karen (Kayin)",
"prefs.opt.ethnicity.shan": "Shan",
"prefs.opt.ethnicity.kachin": "Kachin",
"prefs.opt.ethnicity.mon": "Mon",
"prefs.opt.ethnicity.chin": "Chin",
"prefs.opt.ethnicity.rakhine_arakanese": "Rakhine (Arakanese)",
"prefs.opt.ethnicity.kayah_karenni": "Kayah (Karenni)",
"prefs.opt.ethnicity.other_myanmar_ethnic": "Other Myanmar Ethnic",
"prefs.opt.ethnicity.chinese": "Chinese",
"prefs.opt.ethnicity.indian": "Indian",
"prefs.opt.ethnicity.black_african_descent": "Black/African Descent",
"prefs.opt.ethnicity.east_asian": "East Asian",
"prefs.opt.ethnicity.south_asian": "South Asian",
"prefs.opt.ethnicity.hispanic_latino": "Hispanic/Latino",
"prefs.opt.ethnicity.middle_eastern": "Middle Eastern",
"prefs.opt.ethnicity.native_american": "Native American",
"prefs.opt.ethnicity.pacific_islander": "Pacific Islander",
"prefs.opt.ethnicity.white_caucasian": "White/Caucasian",
"prefs.opt.ethnicity.other": "Other",

// yes/no/sometimes for filters + No preference
"prefs.opt.yn.yes": "Yes",
"prefs.opt.yn.sometimes": "Sometimes",
"prefs.opt.yn.no": "No",
"prefs.opt.yn.prefer_not_to_say": "Prefer not to say",
"prefs.opt.yn.no_preference": "No preference",

// education
"prefs.opt.edu.high_school": "High School",
"prefs.opt.edu.undergrad": "Undergrad",
"prefs.opt.edu.postgrad": "Postgrad",
"prefs.opt.edu.prefer_not_to_say": "Prefer not to say",
"prefs.opt.edu.no_preference": "No preference",


//EditProfilePage

  "edit": {
    "title": "Edit Profile",
    "subtitle": "Tune your profile to find better matches. Changes are saved to your account.",
    "save": "Save",
    "saving": "Saving…",
    "saveProfile": "Save Profile",
    "photos": {
      "title": "My Photos",
      "hint": "Tap to add, drag to reorder",
      "caption": "First photo is your cover; drag to reorder.",
      "replaceTip": "Click to replace",
      "drag": "Drag",
      "add": "Add Photo"
    },
    "prompts": {
      "title": "Written Prompts",
      "required": "3 answers required",
      "prompt": "Prompt",
      "answer": "Your answer",
      "answerPH": "Write something interesting…"
    },
    "voice": {
      "title": "Voice Prompt",
      "hint": "Record up to 30s or paste a link",
      "titlePH": "Voice prompt title (e.g., “My perfect weekend looks like”)",
      "sample": "Hear a sample",
      "rerecord": "Re-record",
      "remove": "Remove from profile",
      "useRecording": "Use this recording (upload)",
      "currentAudio": "Current profile audio",
      "tapStart": "Tap to start recording",
      "tapStop": "Tap to stop",
      "err": {
        "unsupported": "Recording not supported on this device/browser.",
        "permission": "Microphone permission denied or unavailable."
      },
      "toast": {
        "uploaded": "Voice uploaded and linked to your profile.",
        "fail": "Upload failed. Make sure the 'onboarding' bucket exists and is public."
      }
    },
    "vitals": {
      "title": "My Vitals",
      "firstName": "First name",
      "lastName": "Last name",
      "gender": "Gender",
      "sexuality": "Sexuality",
      "birthdate": "Birthdate",
      "ageAuto": "Age (auto)",
      "height": "Height",
      "heightHint": "e.g., 5' 9\"",
      "location": "Location",
      "hometown": "Hometown",
      "ethnicity": "Ethnicity",
      "religion": "Religion",
      "children": "Children",
      "familyPlans": "Family plans",
      "intention": "Dating intention",
      "schools": "Schools",
      "schoolPH": "School name",
      "addSchool": "Add another school",
      "removeSchoolAria": "Remove school",
      "education": "Education level",
      "job": "Job title",
      "workplace": "Workplace",
      "drinking": "Drinking",
      "smoking": "Smoking",
      "weed": "Weed usage",
      "drugs": "Drugs",
      "politics": "Political belief"
    },
    "common": {
      "change": "Change",
      "remove": "Remove",
      "selectPH": "Select…"
    },
    "toast": {
      "photoFail": "Photo upload failed. Please try again.",
      "saveFail": "Save failed. Please try again.",
      "saveOk": "Profile updated!"
    },

    "msg": {
      "alreadyInstalled": "✅ Already installed on this device.",
      "noPrompt":
        "If nothing happens, please open in Chrome on Android or add to Home Screen from the browser menu.",
      "installing": "📲 Installing… check your home screen.",
      "dismissed": "You dismissed the install. You can try again anytime.",
      "failed": "Install failed. Please try again."
    },

    "alt": {
      "share": "Tap the Share button in Safari",
      "addToHome": "Choose Add to Home Screen",
      "confirmAdd": "Confirm Add"
    },

    "download": {
      "title": "Download MyanMatch",
      "android": "Android",
      "androidDesc": "Install the app to your home screen for the best experience.",
      "installAndroid": "Install on Android",
      "already": "Already installed",
      "androidTip": "Tip: Use Chrome on Android. If the button doesn’t appear, open the ⋮ menu and tap “Install app” or “Add to Home screen”.",
      "ios": "iOS (iPhone)",
      "iosDesc": "Install from Safari using “Add to Home Screen”.",
      "iosStep1": "1) In Safari, tap the Share button.",
      "iosStep2": "2) Choose Add to Home Screen.",
      "iosStep3": "3) Tap Add to finish.",
      "iosNote": "Note: iOS installs PWAs from Safari. Open MyanMatch in Safari if you’re using another browser."
    },

    "profile": {
      "about": "About"
    },

  }

  },
  my: {
    "settings.title": "Settings",
    "nav.viewProfile": "ပရိုဖိုင် ကြည့်ရန်",
    "nav.editProfile": "ပရိုဖိုင် ပြင်ဆင်ရန်",
    "nav.verify": "အကောင့်အစစ် မှတ်ပုံတင်ခြင်း",
    "nav.pref": "အရည်အသွေး ရွေးချယ်ခြင်း",
    "nav.plan": "အကောင့် အဆင့်မြင့်တင်ခြင်း",
    "nav.boost": "ပရိုဖိုင် Boost လုပ်ရန်",
    "nav.boostActive": "Boost တင်ထားသည် — {time} အထိ",
    "nav.whatworks": "အကြံပြုချက်များ",
    "nav.photoGuide": "ဓာတ်ပုံ လမ်းညွှန်",
    "nav.promptGuide": "‌စိတ်ကူးစိတ်သန်း လမ်းညွှန်",
    "nav.matchingGuide": "လိုက်ဖက်မှု လမ်းညွှန်",
    "nav.convGuide": "စကားပြော လမ်းညွှန်",
    "nav.language": "ဘာသာစကား",
    "nav.download": "ဖုန်း App သွင်းမည်",
    "nav.changePw": "စကားဝှက်ပြောင်းရန်",
    "nav.acctSecurity": "အကောင့် လုံခြုံရေး",
    "nav.logout": "ထွက်ရန်",
    "nav.delete": "အကောင့် ပယ်ဖျက်ရန်",
    "tip.fresh": "အကောင်းဆုံးကိုက်ညီမှု ရဖို့ ပရိုဖိုင်ကို မကြာခဏ အပ်ဒိတ်လုပ်ထားပါရှင့်။",
    "lang.english": "အင်္ဂလိပ်",
   "lang.myanmar": "မြန်မာ",
   "boost.title": "ပရိုဖိုင် Boost တင်မည်",
   "boost.desc": "🚀 Boost တင်ခြင်းဖြင့် သင့်ကို Users Of The Day တွင် ၂၄ နာရီထိ ထည့်သွင်းပြီးထင်ရှားစေပါမည်။",
   "boost.price": "စျေးနှုန်း",
   "boost.balance": "သင့်လက်ကျန်",
   "boost.notEnough": "လုံလောက်သော coins မရှိပါ။ coins အထပ်မံဝယ်ယူပါ။",
   "boost.processing": "ဆောင်ရွက်နေသည်…",

"boost.button": "{price} ဖြင့် Boost လုပ်မည်",
"pricing.titleWindow": "အဆင့်မြင့်တင်ခြင်း",
"pricing.ribbon": "အဖွဲ့ဝင်",
"pricing.title": "MyanMatch အတွေ့အကြုံကို မြှင့်တင်လိုက်ပါရှင့်။",
"pricing.subtitle": "coins ဖြင့် {days} ရက် အစီအစဉ်များ",
"pricing.subtitlePromo": "ဈေးနုန်း 50% ဒစ်စကောင့် ပေးနေပါပြီရှင့်။",
"pricing.currentBalance": "လက်ကျန်",
"pricing.currentPlan": "လက်ရှိ အဆင့်",
"pricing.expiresOn": "ကုန်ဆုံးမည့်ရက်",
"pricing.expired": "အစီအစဉ်ကုန်ဆုံးထားပါသည် — ဆက်သုံးရန် ပြန်လည်ဝယ်ယူပါရှင့်။",
"pricing.refundNote": "လှုံခြုံစိတ်ချသောဝယ်ယူမှု။ အဆင့်မြင့်တင်ခြင်းများ မရရှိပါက coins ကို ပြန်အမ်းပေးပါမယ်ရှင့်။",
"pricing.badge50": "50% လျော့ဈေး • သတ်မှတ်ချိန်အတွင်းသာ",
"pricing.perDays": "/ {days} ရက်",
"pricing.plusDesc": "၃၀ ရက် သက်တမ်း — ပိုမိုကောင်းမွန်သောအတွေ့အကျုံသစ်။",
"pricing.xDesc": "အပြည့်အစုံ ၃၀ ရက် — တိကျစွာ ကိုက်ညီမှုရှာမယ်။",
"pricing.upgradeFromPlus": "Plus မှ အဆင့်မြှင့်ခြင်း",
"pricing.noteOnX": "သင့်အကောင့် MyanMatchX (အမြင့်တန်း) ဖြစ်နေပါသည်ရှင့်။",
"pricing.managePref": "MyanMatchX အဆင့်မြင်တင်ခြင်းအောင်မြင်ပါသည်ရှင့်",
"pricing.msg.signInFirst": "စတင် အသုံးပြုရန် စာရင်းဝင်ပါရှင့်။",
"pricing.msg.notEnough": "coins မလုံလောက်ပါ။ {need} လိုအပ်သည် (သင့်မှာ {have} ရှိသည်)။",
"pricing.msg.nowPlus": "🎉 သင်သည် MyanMatch+ အဖြစ် {days} ရက် ( {date} အထိ ) ဖြစ်နေပါပြီရှင်။",
"pricing.msg.nowX": "🚀 MyanMatchX အဖြစ် {days} ရက် ( {date} အထိ ) မှကြိုဆိုပါတယ်ရှင်။",
"pricing.msg.somethingWrong": "တစ်စုံတစ်ခုမှားယွင်းနေပါသည်ရှင့်။",
"pricing.btn.alreadyX": "X ရှိပြီးသား",
"pricing.btn.renewPlus": "MyanMatch+ ပြန်လည်ဝယ်ယူမည် – {price}",
"pricing.btn.getPlus": "MyanMatch+ ဝယ်ယူမည် – {price}",
"pricing.btn.renewX": "MyanMatchX ပြန်လည်ဝယ်ယူမည် – {price}",
"pricing.btn.upgradeToX": "X သို့ အဆင့်မြှင့်မည် – {price}",
"pricing.btn.getX": "MyanMatchX ဝယ်ယူမည် – {price}",

"pricing.b.plus.swaps50": "နေ့စဉ် ရှာဖွေမှုအကောင့်ပေါင်း ၅၀ အထိ",
"pricing.b.common.seeLikes": "မိမိကို ကြိုက်နစ်သက်နေသူများအား ကြည့်ရှုနိုင်",
"pricing.b.x.unlimitedSwaps": "ရှာဖွေမှု ကန့်သတ်မရှိ",
"pricing.b.x.advancedPref": "အဆင့်မြင့် အရည်အသွေးရွေးချယ်ခြင်း (filter များ အားလုံး ဖွင့်)",
"pricing.b.x.boost1day": "Users of the Day တွင် ၁ ရက် Boost",
"pricing.b.x.undo5": "ပြောင်းရွေ့မှု Undo ၅ ကြိမ်",

"pricing.btn.alreadyActiveUntil": "လက်ရှိအသုံးပြု — {date} အထိ",
"pricing.msg.xAlreadyActive": "MyanMatchX ကို {date} အထိ အသုံးပြုနေပြီးသား ဖြစ်ပါသည်ရှင်။",
"pricing.msg.boostActivated": "🚀 Explore တွင် ၂၄ နာရီအတွက် Boost ပြုလုပ်ပြီးပါပြီရှင်။",

// --- Verify page ---
"verify.title": "အကောင့်စစ်မှန်ကြောင်း မှတ်ပုံတင်ခြင်း",
"verify.subtitle": "လုံခြုံမှုအတွက် Selfie ၂ပုံ လိုအပ်သည် — အများယုံကြည်စိတ်ချရကြစေသော MyanMatch အကောင့်ကို အသုံးပြုပါရှင့်။",
"verify.kycStatus": "KYC အခြေအနေ",
"verify.loading": "စာရင်းသွင်းနေ…",
"verify.verified": "✔ အတည်ပြုထားသည်ရှင်",
"verify.addAvatar": "ဆက်လုပ်ရန် ပရိုဖိုင်ဓာတ်ပုံ ထည့်ပါ",
"verify.badgeNote": "သတိပြုရန်။ မှတ်ပုံတင်ထားသော မိမိ၏ ပရိုဖိုင်ဓာတ်ပုံ ပြောင်းလဲလျှင် အတည်ပြုအမှန်ခြစ် ဖယ်ရှားခံရမယ်ရှင်။",
"verify.selfieA": "Selfie A",
"verify.selfieB": "Selfie B",
"verify.tapToTake": "နှိပ်၍ selfie ဓာတ်ပုံ တင်ပါ",
"verify.remove": "ဖျက်ရန်",
"verify.warn.identical": "Selfie နှစ်ပုံသည် တူညီနေသည်။ ပိုစ်စ် ပြောင်းပြီး တစ်ပုံကို ပြန်ရိုက်ပေးပါရှင်။",
"verify.btn.submit": "စစ်ဆေးရန် စာရင်းသွင်းမည်",
"verify.btn.submitting": "စာရင်းသွင်းနေသည်…",
"verify.btn.pending": "စစ်ဆေးနေဆဲ…",
"verify.tip": "အကြံပြုချက် — မျက်နှာ ရှင်းလင်းပြီး & မီးအလင်းကောင်းစွာသုံးပါ ⇒ အတည်ပြု မှုအမြန်ရနိုင်သည်ရှင့်။",
"verify.list.noCover": "ဝတ်ဆင်ထားသည့် မျက်မှန်နက်၊ မျက်နှာဖုံး၊ effects များ မသုံးပါနဲ့ရှင့်။",
"verify.list.frontCam": "အတည်ပြုခြင်း လမ်းညွှန်စာရေးသားချက်ကို လိုက်နာပါရှင့်။",
"verify.list.useOnly": "ဤဓာတ်ပုံများကို အတည်ပြုရုံအတွက်သာ အသုံးပြုပြီး လုံခြုံစွာ သိမ်းဆည်းထားပါတယ်ရှင့်။",
"verify.msg.submitted": "တင်ပြီးပါပြီ! မကြာမီ စစ်ဆေးပေးမည် — အတည်ပြုပြီးနောက် အမှန်ခြစ် ပေါ်လာပါမယ်ရှင်။",
"verify.err.signInFirst": "အရင် စာရင်းဝင်ပေးပါ။",
"verify.err.needBoth": "Selfie ၂ပုံလုံး ထည့်ပေးပါ။",
"verify.err.identical": "Selfie A နှင့် Selfie B တူညီနေပါသည် — ပိုစ်စ် မတူပဲ တစ်ပုံကို ပြန်ရိုက်ပေးပါရှင်။",
"verify.err.generic": "တင်သွင်းမှု မအောင်မြင်ပါ — ခဏကြာပြီး နောက်တစ်ကြိမ် ကြိုးစားပေးပါရှင်။",
"verify.denied.title": "အတည်ပြုမှတ်ပုံတင် ပြစ်ဒဏ်ပေးခြင်း",
"verify.denied.default": "သင့် အတည်ပြုမှုကို ခွင့်ပြုမပေးနိုင်ပါ။ ပိုထင်ရှားသည့် ဓာတ်ပုံများနှင့် ထပ်မံကြိုးစားပေးပါရှင်။",
"verify.denied.ok": "OK",
"verify.alt.avatar": "သင့် ပရိုဖိုင်ဓာတ်ပုံ",
"verify.alt.example": "နမူနာ — {prompt}",
"verify.samplePrefix": "နမူနာ • {prompt}",

// Prompt labels
"verify.p.bigSmile": "ပြုံးပြုံးနဲ့ ရယ်ပြပါ 😄",
"verify.p.peaceSign": "ငြိမ်းချမ်းရေး လက်၂ချောင်း ✌️",
"verify.p.thumbsUp": "လက်မထောင်ပါ 👍",
"verify.p.turnRight": "ခေါင်းကို ညာဘက် ပြောင်းကြည့်ပါ ➡️",
"verify.p.touchNose": "နှာခေါင်းကို ထိပါ 👃",
"verify.p.holdThree": "လက်ခလယ် သုံးချောင်း မြှောက်ပြပါ 🖐️(3)",
"verify.p.lookUpEyes": "မျက်လုံးများကို အပေါ်ဘက် လှည့်ကြည့်ပါ 👀",

// src/i18n.jsx  (append into STRINGS.my)
"market.coins": "Coins",
"market.coinsLower": "coins",
"market.refresh": "ပြန်စသည်",
"market.pending": "လုပ်ဆောင်နေသည် — {type}",
"market.type.deposit": "ငွေသွင်းခြင်း",
"market.type.withdraw": "ငွေထုတ်ခြင်း",
"market.action.deposit": "ငွေသွင်း",
"market.action.withdraw": "ငွေထုတ်",
"market.action.history": "မှတ်တမ်း",
"market.action.guide": "လမ်းညွှန်",
"market.tab.buy": "ဝယ်မယ်",
"market.tab.sell": "ရောင်းမယ်",
"market.giftStore": "လက်ဆောင်ဆိုင်",
"market.searchGifts": "လက်ဆောင်များ ရှာဖွေ…",
"market.noGifts": "ရရှိနိုင်သော လက်ဆောင် မရှိပါ။",
"market.buy.buy": "ဝယ်မယ်",
"market.buy.buying": "ဝယ်ယူနေသည်…",

"market.sell.myGifts": "ကျွန်ုပ်၏ လက်ဆောင်များ",
"market.sell.noGifts": "ရောင်းရန် လက်ဆောင် မရှိပါရှင်။",
"market.sell.perEach": "/ တစ်ခုလျှင်",
"market.sell.sell": "ရောင်းမယ်",
"market.sell.selling": "ရောင်းနေသည်…",
"market.sell.receivePer": "တစ်ခုလျှင် {amount} coins ပြန်လည်ရရှိမယ်ရှင့်။",
"market.sell.total": "စုစုပေါင်း:",
"market.common.cancel": "မလုပ်တော့ပါ",
"market.common.confirm": "အတည်ပြုမည်",

"market.deposit.title": "ငွေထည့်သွင်းခြင်း ({rate})",
"market.deposit.account": "အကောင့်",
"market.deposit.noAddress": "နံပါတ်/လိပ်စာ",
"market.deposit.copy": "ကူးယူ",
"market.deposit.txRefPlaceholder": "ငွေလွှဲ မှတ်တမ်း ID ( အမှတ်ခြစ်ကိုနိပ်ပြီး ကျော်သွားနိုင်သည်ရှင့်)",
"market.deposit.noTxRef": "ငွေလွှဲ မှတ်တမ်း ID မရှိပါ",
"market.deposit.refundBox": "အခက်အခဲတစ်စုံတစ်ရာကြောင့် coins မရရှိပါက သက်ဆိုင်ရာပမာဏ ပြန်အမ်းပေးပါမယ်ရှင့်။",
"market.deposit.uploadLabel": "screenshot တင်ရန်",
"market.deposit.submit": "ငွေလွှဲ ပြေစာတင်မည်",
"market.deposit.submitting": "တင်နေသည်…",
"market.deposit.msgSubmitted": "စာရင်းတင်ပြီးပါပြီရှင့်။ မကြာမီ Coins ရရှိပါမည်။",
"market.deposit.msgError": "စာရင်းတင်သွင်းမှု မအောင်မြင်ပါ — ထပ်မံကြိုးစားပါရှင့်။",
"market.deposit.chooseMethod": "ငွေလွှဲ နည်းလမ်း တစ်ခုရွေးချယ်ပါရှင်။",
"market.deposit.uploadScreenshotFirst": "ငွေလွှဲ screenshot ကို တင်ပေးပါရှင်။",
"market.deposit.footerNote": "ငွေလွှဲပြီးနောက် screenshot + Tx ID ကို တင်ပါ။ အချိန်တိုအတွင်း coins ရရှိပါမည်ရှင်။",

"market.withdraw.title": "Coins ထုတ်ယူခြင်း",
"market.withdraw.namePlaceholder": "လက်ခံရရှိမည့် အကောင့်အမည်",
"market.withdraw.noPlaceholder": "လက်ခံ အကောင့်နံပါတ် / wallet လိပ်စာ",
"market.withdraw.amountPlaceholder": "ပမာဏ (အနည်းဆုံး {min}, အများဆုံး {max})",
"market.withdraw.ruleText": "အနည်းဆုံး ထုတ်ယူမှု {min} coins — လက်ကျန်တွင် အနည်းဆုံး {keep} coins ကျန်ရှိရမည်ရှင့်။",
"market.withdraw.request": "ထုတ်ယူရန် စာရင်းတင်မည်",
"market.withdraw.footer": "ထုတ်ယူမှုများကို မှားယွင်းမှုမရှိစေရန် သေချာစစ်ဆေးပါ, အချိန်တိုအတွင်းထုတ်ယူမှုပြီးဆုံးပါမည်ရှင့် ",
"market.withdraw.chooseMethod": "ထုတ်ယူ နည်းလမ်း တစ်ခုရွေးပါရှင်။",
"market.withdraw.enterName": "အကောင့်အမည် ထည့်ပါ။",
"market.withdraw.enterNo": "အကောင့်နံပါတ် / လိပ်စာ ရိုက်ထည့်ပါ။",
"market.withdraw.minAmount": "အနည်းဆုံး ထုတ်ယူပမာဏ {min} coins ဖြစ်ပါသည်ရှင်။",
"market.withdraw.maxAmount": "အများဆုံး {max} coins ထုတ်ယူနိုင်သည်။ လက်ကျန်တွင် {keep} coins ထားရှိရမည်ရှင့်။",
"market.withdraw.createFailed": "တင်ပြမှု မအောင်မြင်ပါရှင်။",
"market.withdraw.msgQueued": "ထုတ်ယူ စာရင်းတင်ပြီးပါပြီ — ပြီးစီးသည့်အခါ အသိပေးပါမည်ရှင်။",

"market.history.title": "ငွေလှဲ/ဝယ်ယူ မှတ်တမ်း",
"market.history.empty": "မှတ်တမ်း မရှိသေးပါ။",
"market.history.bought": "ဝယ်ယူခဲ့သည်",
"market.history.sold": "ရောင်းခဲ့သည်",
"market.history.deposit": "ငွေသွင်း",
"market.history.withdraw": "ငွေထုတ်",

"market.guide.title": "အသုံးပြု အကြံပြုချက်များ",
"market.guide.item1": "လက်ဆောင်ဝယ်ရန် coins ထည့်ပြီး ပတ်ဆံအိတ်ကို အဆင့်မြှင့်တင်ပါရှင့်။",
"market.guide.item2": "လက်ဆောင်များကို ပြန်လည်ရောင်းချပြီး coins ပြန်ရယူပါရှင်။",
"market.guide.item3": "ဝယ်မယ်/ရောင်းမယ် ဖြင့် စုစုပေါင်းကို စီမံခန့်ခွဲပါ — တစ်ခုချင်း/အားလုံး ရောင်းနိုင်သည်။",
"market.guide.item4": "မှတ်တမ်း တွင် ငွေသွင်း/ငွေထုတ်/အဝယ်/အရောင်း များကို တွေ့နိုင်ပါသည်ရှင်။",
"market.guide.item5": "အကူအညီ လိုပါက မည်သည့်အချိန်မဆို ဆက်သွယ်နိုင်သည်ရှင့်။",

"market.msg.signInAgain": "ပြန်လည် ဝင်ရောက်ပါရှင်။",
"market.msg.notEnoughCoins": "coins မလုံလောက်ပါရှင်။",
"market.err.deductFailed": "coins ထုတ်ယူမှုမအောင်မြင်ပါရှင်။",
"market.err.addGiftFailed": "လက်ဆောင် ထည့်သွင်းမှု မအောင်မြင်ပါရှင်။",
"market.err.buyError": "ဝယ်ယူရာတွင် ပြဿနာ ဖြစ်နေပါသည်ရှင်။",

"chat.newMatches": "ဆုံဆည်းနိုင်သူများ",
"chat.recent": "ခင်မင်ကြမယ် {heart}",

"matches.header": "Likes You",
"matches.upgrade": "အဆင့်မြှင့်မည်",
"matches.onboarding.title": "သင့်ကို စိတ်ဝင်စားသူများကို ကြည့်ပါရှင့်",
"matches.onboarding.desc": "သင့်ကို စိတ်ဝင်စားသူများနှင့် ချိတ်ဆက်မလား သင်ဆုံးဖြတ်နိုင်သည်ရှင့်။",
"matches.onboarding.gotit": "နားလည်ပါပြီ",
"matches.empty.title": "လူကြီးမင်းသည်အကောင့်အသစ်ဖြစ်သောကြောင့်— စိတ်ဝင်စားသူရှာမတွေ့သေးပါရှင့်။",
"matches.empty.desc": "ပရိုဖိုင်ကို Boost လုပ်ပြီး ပိုမိုဂရုပြုမှုကိုရယူလိုက်ပါရှင်။",
"matches.empty.tryBoost": "Boost လုပ်မည်",
"matches.locked": "ကြည့်ရှုရန် အဆင့်မြှင့်ပါ",
"matches.upgradeBar": "MyanMatch Plus/X ဖြင့် သင့်ကို စိတ်ဝင်စားသူများကို ကြည့်ရှုနိုင်သည်ရှင်",
"matches.modal.title": "ကိုက်ညီမှု ရရှိခဲ့ပါပြီ!",
"matches.modal.desc": "သင်နှင့် {name} တို့ စိတ်ဝင်စားမှုတူညီကြပါသည်။ ၂ယောက်ကြားနားလည်မှုကိုအခုဖဲရှာဖွေလိုက်ပါရှင်",
"matches.modal.sayhi": "စပြီးနုတ်ဆက်လိုက်ပါနော်🌸",
"matches.modal.keep": "ဆက်လက်ကြည့်မယ်",
"matches.upgradeBar.btn": "အဆင့်မြှင့်မည်",

// Explore
"explore.ribbon": "Users of the Day",
"explore.title": "ယနေ့ လူကြိုက်များသော ပရိုဖိုင်များ",
"explore.subtitle": "ယနေ့လူကြိုက်များသောပရိုဖိုင်များကို ဝင်ရောက်ကြည့်ရှုပြီးမိမိနှင့် ထပ်တူကျနိုင်သောသူကို ရှာဖွေနိုင်ပါပြီရှင်။ စိတ်ဝင်စားစေဖို့ ယခုဖဲ🎁နုတ်ဆက်လက်ဆောင်တစ်ခု ပို့လိုက်ပါနော်။",
"explore.boostMe": "Boost တင်မည်",
"explore.boosted": "Boost တင်ထားသည်",
"explore.card.gift": "လက်ဆောင်",
"explore.banner.error": "လူကြိုက်များသော ပရိုဖိုင်များကို ရှာမတွေ့သေးပါရှင်။",
"explore.empty.ribbon": "ယခုအခါ Boost တင်ထားသူ မရှိသေးပါရှင်",
"explore.empty.title": "ယနေ့ ပထမဦးဆုံး ထင်ရှားသူ ဖြစ်လိုက်ပါရှင်",
"explore.empty.desc": "သင့်ပရိုဖိုင်ကို Boost တင်ပြီး ဤနေရာတွင် ထိပ်တန်း ဖော်ပြလိုက်ပါရှင့်။",

// Gift modal
"gift.title": "လက်ဆောင် ပို့ရန်",
"gift.loading": "သင့်လက်ဆောင်များကို ဖွင့်နေသည်…",
"gift.empty": "သင့်မှာ လက်ဆောင် မရှိသေးပါ။ စျေးဆိုင်တွင် ဝယ်ယူပါရှင့်။",
"gift.commentPH": "မှတ်ချက် ထည့်ရန် (မဖြစ်မနေ မဟုတ်ပါရှင့်)",
"gift.cancel": "မလုပ်တော့ပါ",
"gift.sending": "ပို့နေသည်…",
"gift.send": "လက်ဆောင် ပို့မည်",
"gift.error": "လက်ဆောင် မပို့နိုင်ပါ။ ထပ်ကြိုးစားပါ။",

// Home + Report (append)
"home.verified": "Verified",
"home.loading": "ပရိုဖိုင်များ ဖွင့်နေသည်…",
"home.empty.ribbon": "မကြာခင်ပြန်လာခဲ့ပါရှင့်",
"home.empty.title": "ယခုပရိုဖိုင် မရှိတော့ပါ",
"home.empty.desc": "ခဏစောင့်ဆိုင်းပြီး ပြန်လာကြည့်ပါ၊ သို့မဟုတ် ပရိုဖိုင်ကို Boost လုပ်ပြီး ပိုမိုထင်ရှားသူဖြစ်လိုက်ပါရှင့်။",
"home.noname": "အမည်မရှိ",
"home.voicePrompt": "စကားသံနားထောင်မည်",
"home.dailyLimit": "နေ့စဉ် ကန့်သတ်ချက် ရောက်ရှိပြီးပါပြီ။ မနက်ဖြန်ပြန်လာခဲ့ပါ သို့မဟုတ် အဆင့်မြှင့်ပါရှင့်။",
"home.err.pass": "Pass မှတ်တမ်း မသိမ်းနိုင်ပါ။",
"home.err.like": "Like မမှတ်တမ်းနိုင်ပါ။",
"home.btn.pass": "Pass",
"home.btn.gift": "လက်ဆောင် ပို့မည်",
"home.btn.giftTitle": "လက်ဆောင် ပို့မည် (Superlike)",
"home.btn.like": "Like",

"report.title": "REPORT",
"report.subtitle": "MyanMatch ကို 👮လုံခြုံအောင် အကူအညီ ပေးပါရှင့်",
"report.r1": "ဤပရိုဖိုင်သည် အစစ်မဟုတ်ပါ",
"report.r2": "ဤပရိုဖိုင်တွင် နာမ်မည်ကြီးဆယ်လီ/မိတ်ဆွေ၏ ပုံကို အသုံးပြုထားသည်",
"report.r3": "အပြောအဆို အနေအထား မသင့်လျော်/မလုံခြုံသော အကြောင်းအရာ",
"report.r4": "Spam / လိမ်လည်သူ",
"report.extraLabel": "အသေးစိတ် (မဖြစ်မနေ မဟုတ်ပါရှင့်)",
"report.extraPH": "အခြေအနေ သက်သေအထောက်အထားများ ထည့်ပါ…",
"report.submit": "တင်ပြမည်",
"report.sending": "ပို့နေသည်…",
"report.err.login": "အကောင့်ဝင်ရောက်မည်။",
"report.err.generic": "တင်ပြရာတွင် ပြဿနာ ဖြစ်ခဲ့သည် — ထပ်ကြိုးစားပါရှင့်။",
"report.toast.ok": "တင်ပြပြီးပါပြီ — အကူအညီပေးသည့်အတွက် ကျေးဇူးတင်ပါသည်ရှင်။",
"report.toast.err": "တစ်ခုခု မှားယွင်းနေပါသည်ရှင်။",

// UserProfile page
"profile.loading": "ပရိုဖိုင် ဖွင့်နေသည်…",
"profile.oops": "အိုး!",
"profile.notfound": "ပရိုဖိုင်ကို မတွေ့ပါ။",
"profile.goBack": "ပြန်သွားမည်",
"profile.edit": "ပရိုဖိုင် ပြင်မည်",
"profile.likeSent": "Like ပို့ပြီးပါပြီ!",
"profile.superSent": "Superlike ပို့ပြီးပါပြီ!",

// DeleteAccount
"delete.title": "အကောင့် ပယ်ဖျက်ရန်",
"delete.permanent1": "ဤလုပ်ဆောင်ချက်သည်",
"delete.permanent2": "အပြီးတိုင်",
"delete.permanent3": "ဖြစ်ပြီး ပြန်ပြင်၍မရပါရှင်။",
"delete.readFirst.title": "ရှေ့ဆက်မလုပ်ဆောင်ခင် သိထားပေးပါရှင့်",
"delete.readFirst.body": "အကောင့်ကို ပယ်ဖျက်ပါက မိမိ၏ ပရိုဖိုင်၊ စာများ၊ ကြိုက်နှစ်သက်မှုများ၊ လက်ဆောင်များ၊ Boost များနှင့် သက်ဆိုင်သော အချက်အလက်အားလုံးကို MyanMatch မှ ဖယ်ရှားမည်ဖြစ်ပါသည်။ နောက်မှ ပြန်လည်ရယူနိုင်မည် မဟုတ်ပါရှင့်။",
"delete.emailLabel": "သင့် Gmail",
"delete.emailPH": "you@example.com",
"delete.passwordLabel": "စကားဝှက်",
"delete.passwordPH": "သင့် စကားဝှက်ကို ရိုက်ထည့်ပါ",
"delete.showPwd": "စကားဝှက် ပြရန်",
"delete.hidePwd": "စကားဝှက် ဖျောက်ရန်",
"delete.confirm": "အကောင့်နှင့် အချက်အလက်အားလုံး အပြီးတိုင် ဖယ်ရှားမည်ကို နားလည်ပါသည်။",
"delete.err.default": "အကောင့် ပယ်ဖျက်မှု မအောင်မြင်ပါ။",
"delete.err.generic": "တစ်စုံတစ်ခု မှားယွင်းနေပါသည်။",
"delete.submit": "အကောင့်ကို အပြီးတိုင် ဖျက်မည်",
"delete.submitting": "ဖျက်နေသည်…",
"delete.cancel": "မလုပ်တော့ပါ၊ ပြန်သွားမယ်",
"delete.done.title": "အကောင့် ဖျက်ပြီးပါပြီ",
"delete.done.body": "သင့်အကောင့်နှင့် သက်ဆိုင်သည့် အချက်အလက်အားလုံးကို ဖယ်ရှားပြီးပါပြီ။",
"delete.done.redirecting": "ပြန်လည်ချိန်ညှိနေသည်…",

// ChangePassword
"chpw.back": "နောက်သို့",
"chpw.signedInAs": "လက်ရှိ ဝင်ရောက်အသုံးပြုနေသူ —",
"chpw.currentLabel": "လက်ရှိ စကားဝှက်",
"chpw.newLabel": "စကားဝှက် အသစ်",
"chpw.confirmLabel": "စကားဝှက် အသစ် အတည်ပြု",
"chpw.hint": "အနည်းဆုံး ၈ လုံးဖြစ်ရမည်။ အက္ခရာနှင့် ကိန်းဂဏန်းများ ပါဝင်ရမည်။",
"chpw.msg.enterCurrent": "လက်ရှိ စကားဝှက်ကို ရိုက်ထည့်ပါ။",
"chpw.err.minLen": "စကားဝှက်သည် အနည်းဆုံး ၈ လုံး ဖြစ်ရပါမည်။",
"chpw.err.mix": "အက္ခရာများနှင့် နာမ်ပတ်များ ထည့်သုံးပါ။",
"chpw.err.mismatch": "စကားဝှက်များ တူညီမနေပါ။",
"chpw.err.notSignedIn": "ဝင်ရောက်အသုံးပြုထားခြင်း မရှိပါ။ ကျေးဇူးပြု၍ ထပ်မံ ဝင်ရောက်ပါ။",
"chpw.err.changeFailed": "စကားဝှက် ပြောင်းလဲမှု မအောင်မြင်ပါ။",
"chpw.err.tryAgain": "စကားဝှက် ပြောင်းလဲမှု မအောင်မြင်ပါ — ထပ်မံကြိုးစားပါ။",
"chpw.success": "✅ စကားဝှက် ပြောင်းလဲပြီးပါပြီရှင်။",
"chpw.btn.submit": "စကားဝှက် ပြောင်းရန်",
"chpw.btn.submitting": "မှတ်တမ်းလုပ်နေသည်…",

// Birthdate page
"dob.title": "သင်၏ မွေးသက္ကရာဇ်က ဘယ်နေ့လဲ?",
"dob.confirmTitle": "အချက်အလက် အတည်ပြုပါရှင်",
"dob.age": "{age}",
"dob.born": "{date} တွင် မွေးဖွားသည်",
"dob.edit": "ပြင်မည်",
"dob.confirm": "အတည်ပြုမည်",
"dob.nextAria": "ရှေ့သို့",

// Children page
"children.title": "သားသမီး ရှိပါသလား?",
"children.nextAria": "ရှေ့သို့",
"children.opt.none": "ကလေး မရှိပါ",
"children.opt.have": "ကလေး ရှိပါသည်",
"children.opt.dog": "ခွေး ရှိပါသည်",
"children.opt.cat": "ကြောင် ရှိပါသည်",
"children.opt.pet": "အိမ်မွေးတိရစ္ဆာန် ရှိပါသည်",
"children.opt.na": "မပြောလိုပါ",

// Drinking page
"drink.title": "အရက်သောက်ပါသလား?",
"drink.nextAria": "ရှေ့သို့",
"drink.opt.yes": "သောက်ပါတယ်",
"drink.opt.sometimes": "တခါတရံသောက်ပါတယ်",
"drink.opt.no": "မသောက်တတ်ပါ",
"drink.opt.na": "မပြောလိုပါ",

// Drugs page
"drugs.title": "ဆေး သုံးပါသလား?",
"drugs.nextAria": "ရှေ့သို့",
"drugs.opt.yes": "သုံးပါတယ်",
"drugs.opt.sometimes": "တခါတရံသုံးပါတယ်",
"drugs.opt.no": "မသုံးတတ်ပါ",
"drugs.opt.na": "မပြောလိုပါ",

// Education level page
"edu.title": "ရရှိထားသော ပညာအရည်အချင်းက ဘာလဲ?",
"edu.nextAria": "ရှေ့သို့",
"edu.opt.highschool": "အထက်တန်းအဆင့်",
"edu.opt.undergrad": "တက္ကသိုလ်အဆင့်",
"edu.opt.postgrad": "ဘွဲ့လွန်အဆင့်",
"edu.opt.na": "မပြောလိုပါ",

// Ethnicity page
"eth.title": "တိုင်းရင်းသားသွေးက ဘာလဲ?",
"eth.whyPrefix": "ဘာကြောင့် ဒါကို မေးသလဲဆိုတာ စဉ်းစားနေလား?",
"eth.learnMore": "ပိုမိုလေ့လာမည်။",
"eth.nextAria": "ရှေ့သို့",

"eth.opt.bamar": "ဗမာ",
"eth.opt.karen": "ကရင်",
"eth.opt.shan": "ရှမ်း",
"eth.opt.kachin": "ကချင်",
"eth.opt.mon": "မွန်",
"eth.opt.chin": "ချင်း",
"eth.opt.rakhine": "ရခိုင်",
"eth.opt.kayah": "ကယား(ကရင်နီ)",
"eth.opt.mmOther": "အခြားတိုင်းရင်းသား",
"eth.opt.chinese": "တရုတ်",
"eth.opt.indian": "အိန္ဒိယ",
"eth.opt.african": "အာဖရိကန်",
"eth.opt.eastAsian": "အရှေ့အာရှ",
"eth.opt.southAsian": "တောင်အာရှ",
"eth.opt.hispanic": "ဟစ်စပန်နစ်/လက်တင်နို",
"eth.opt.mideast": "အလယ်အာရှ",
"eth.opt.native": "နေးတီးဗ် အမေရိကန်",
"eth.opt.pacific": "ပစိဖိတ် ကျွန်းသား",
"eth.opt.white": "လူဖြူ(ကောက်ကေးရှင်း)",
"eth.opt.other": "အခြား",

// Family plans page
"fam.title": "မိသားစုအစီအစဉ် ဘယ်လိုရှိပါလဲ?",
"fam.nextAria": "ရှေ့သို့",
"fam.opt.dont": "ကလေး မလိုချင်ပါ",
"fam.opt.want": "ကလေး လိုချင်ပါတယ်",
"fam.opt.open": "ကလေး ရှိရှိ/မရှိရှိ အဆင်ပြေပါတယ်",
"fam.opt.unsure": "မသေချာသေး",
"fam.opt.na": "မပြောလိုပါ",

// Gender page
"gender.title": "သင့်ကို ကိုယ်စားပြုသော လိင်အမျိုးအစား ဘယ်ဟာလဲ?",
"gender.subtitle": "MyanMatch တွင် လိင်အမျိုးအစား ၃ မျိုးအုပ်စုအဖြစ် တင်စားပြီး ကိုက်ညီမှုကို ထောက်ခံပေးထားပါတယ်ရှင့်။ နောက်တစ်ချိန်မှာ သင့်လိင်အမျိုးအစားအကြောင်း ပိုမိုအသေးစိတ် ထည့်နိုင်ပါတယ်ရှင့်။",
"gender.learnMore": "ပိုမိုလေ့လာမည်",
"gender.learnTail": "— ကျွန်တော်တို့ မိတ်ဆက်အကြံပြုရာတွင် လိင်အမျိုးအစားကို ဘယ်လိုအသုံးပြုလဲ",
"gender.nextAria": "ရှေ့သို့",
"gender.opt.man": "အမျိုးသား",
"gender.opt.woman": "အမျိုးသမီး",
"gender.opt.nonbinary": "ဒွိလိင်",

// Hometown page
"hometown.title": "သင့် မွေးရပ်မြို့ ဘယ်မြို့လဲ?",
"hometown.placeholder": "မွေးရပ်မြို့ကို ရိုက်ထည့်ပါ",
"hometown.nextAria": "ရှေ့သို့",

// Intention page
"intent.title": "တွေ့ဆုံရေး ရည်ရွယ်ချက် ဘယ်လိုလဲ?",
"intent.nextAria": "ရှေ့သို့",
"intent.opt.lifePartner": "ဘဝတွဲဖော်",
"intent.opt.long": "‌‌ရေရှည်ကာလ ဆက်ဆံရေး",
"intent.opt.longOpenShort": "ရေရှည်ကာလ မျှော်လင့်ပေမယ့်၊ ရေတိုလည်း အဆင်ပြေ",
"intent.opt.shortOpenLong": "ရေတိုကာလ မျှော်လင့်ပေမယ့်၊ ရေရှည်လည်း အဆင်ပြေ",
"intent.opt.short": "အချိန်တို ဆက်ဆံရေး",
"intent.opt.figuring": "တွေ့ဆုံရေး ရည်ရွယ်ချက်ကို စဉ်းစားနေဆဲပါတယ်",
"intent.opt.na": "မပြောလိုပါ",

// Interested-in page
"interested.title": "ဘယ်သူတို့နဲ့ တွေ့ဆုံချင်ပါသလဲ?",
"interested.subtitle": "တွေ့ဆုံဖို့ အဆင်ပြေတဲ့ အုပ်စုတွေ အားလုံးကို ရွေးပါ",
"interested.nextAria": "ရှေ့သို့",
"interested.opt.men": "ကျား",
"interested.opt.women": "မ",
"interested.opt.nb": "Non-binary လူများ",
"interested.opt.everyone": "အားလုံး",

// Job title page
"job.title": "သင့် တာဝန်ခန့်ထားမှု/ရာထူး ဘယ်ဟာလဲ?",
"job.placeholder": "သင့်လုပ်ငန်းရာထူးကို ရိုက်ထည့်ပါ",
"job.nextAria": "ရှေ့သို့",

// Common
"common.ok": "OK",
"common.retry": "ထပ်မံကြိုးစားမည်",

// Location page
"loc.title": "နေထိုင်ရာ မြို့/မြို့နယ် ဘယ်နေရာလဲ?",
"loc.subtitle": "အခြားသူများကို ပြသမယ့်အချက်အလက်မှာ မြို့/မြို့နယ် အမည်တစ်ခုပဲ ဖြစ်ပါတယ်။",
"loc.inputPH": "အောက်က ခလုတ်ကို နှိပ်ပြီး စစ်ဆေးပါ",
"loc.btn.use": "လက်ရှိ တည်နေရာကို အသုံးပြုမည်ရှင့်",
"loc.btn.loading": "ရှာဖွေနေသည်…",
"loc.nextAria": "ရှေ့သို့",

// Location popups
"loc.pop.unsupported.title": "တည်နေရာကို မပံ့ပိုးသေးပါရှင်",
"loc.pop.unsupported.msg": "သင်၏ ဘရောက်ဇာသည် တည်နေရာကို မပံ့ပိုးပါ။ အပ်ဒိတ်လုပ်ပါ သို့မဟုတ် ဆက်တင်တွင်ခွင့်ပြုပေးပါရှင့်။",
"loc.pop.nocity.title": "မြို့/မြို့နယ် မတွေ့ပါ",
"loc.pop.nocity.msg": "မြို့/မြို့နယ်ကို မသိနိုင်ပါ။ ထပ်ကြိုးစားပါ။",
"loc.pop.fetch.title": "တည်နေရာ မရရှိနိုင်ပါ",
"loc.pop.fetch.msg": "အင်တာနက်နှင့် တည်နေရာ ခွင့်ပြုချက်များကို စစ်ဆေးပြီး ပြန်ကြိုးစားပါရှင်။",
"loc.pop.blocked.title": "တည်နေရာ ပိတ်ထားသည်",
"loc.pop.blocked.denied": "ခွင့်ပြုချက် ပိတ်ထားပြီးပါသည်။ ဘရောက်ဇာဆက်တင်တွင် တည်နေရာကို ခွင့်ပြုပါ။",
"loc.pop.blocked.generic": "GPS တည်နေရာ မရရှိနိုင်ပါ။ ထပ်ကြိုးစားကြည့်ပါရှင်။",

// Name page
"name.title": "နာမည် ဘာလဲ?",
"name.firstPH": "ပထမအမည်",
"name.lastPH": "ဒုတိယအမည်",
"name.note": "နောက်က အမည် (Last name) မဖြစ်မနေ မဟုတ်ပါ၊ ကိုက်ညီသူတွေနဲ့သာ မျှဝေပါမည်။",
"name.why": "ဘာလို့?",
"name.alwaysVisible": "ပရိုဖိုင်ပေါ်တွင် အမြဲမြင်ရပါမည်",
"name.nextAria": "ရှေ့သို့",

// --- Onboarding Media page ---
"media.title": "ဗီဒီယိုနှင့် ဓာတ်ပုံများ ထည့်ပါ",
"media.subtitle": "ပရိုဖိုင် အတွက် ဓာတ်ပုံ/ဗီဒီယို ၆ ခု ထည့်ပါ။",
"media.subtitleNote": "တကယ့်နေ့စဉ်ဘဝ ကဏ္ဍများ ပိုများလေ — ကိုက်ညီမှု ပိုကောင်းလေ!",
"media.uploading": "တင်နေသည်…",
"media.add": "ထည့်ရန်",
"media.remove": "ဖယ်ရန်",
"media.requiredNote": "ထည့်ရန်/ပြင်ရန် တို့ကို နှိပ်ပါ။ ဆက်လက်လုပ်ကိုင်နိုင်ရန် {count} ခု လိုအပ်သည်။",
"media.tip": "ဘာတင်ရမလဲ မသေချာဘူးလား?",
"media.tipLink": "ပရိုဖိုင်း ဓာတ်ပုံ အကြံပြုချက်များ",
"media.nextAria": "ရှေ့သို့",
"media.err.signInFirst": "မီဒီယာတင်ရန် အကောင့်ဝင်ရောက်ပါ။",
"media.err.signInAgain": "အသုံးပြုသူ မဝင်ရောက်ထားပါ! ပြန်လည် ဝင်ရောက်ပါ။",
"media.err.uploadFailed": "တင်သွင်းမှု မအောင်မြင်ပါ",

// Political Belief page
"pol.title": "သင့် နိုင်ငံရေးသဘောထား ဘယ်လိုလဲ?",
"pol.nextAria": "ရှေ့သို့",
"pol.opt.liberal": "လွတ်လပ်သောလက်ဝဲမူဝါဒ",
"pol.opt.moderate": "ကြားနေမူဝါဒ",
"pol.opt.conservative": "ထိန်းသိမ်းသောလက်ယာမူဝါဒ",
"pol.opt.notPolitical": "နိုင်ငံရေး မတက်ကြွပါ",
"pol.opt.other": "အခြား",
"pol.opt.na": "မပြောလိုပါ",

// Profile Prompts page
"prompts.step": "အဆင့် {cur}/{total}",
"prompts.title": "ပရိုဖိုင် အဖြေတွေ ရေးသားပါရှင်",
"prompts.subtitle": "Prompt တွေရွေးပြီး ကိုယ်ပိုင်ပုံစံကို ပြသလိုက်ပါ!",
"prompts.selectPrompt": "Prompt ကို ရွေးပါ",
"prompts.answerPH": "မိမိ အဖြေကို ရေးပါ...",
"prompts.chooseFirstPH": "အရင် Prompt ကို ရွေးပါ",
"prompts.required3": "အဖြေ ၃ ခု လိုအပ်သည်",
"prompts.nextAria": "ရှေ့သို့",
"prompts.modal.title": "ပရိုဖိုင် Prompt ရွေးချယ်ပါ",

// Prompt pool (my)
"prompts.pool.rant": "ပေါက်ကွဲတတ်တဲ့အားနည်းချက်လေး တစ်ချက် ပြောပြချင်တာဆိုရင်",
"prompts.pool.keyToHeart": "ကျနော့်နှလုံးသားအတွက် သော့ချက်က",
"prompts.pool.setupPunchline": "မင်းကိုစိတ်ဝင်စားမှုရှိတယ်ဆိုရင် ကျနော်ပြမယ့်အရိပ်က",
"prompts.pool.unusualSkills": "ထူးထူးခြားခြား ကျွမ်းကျင်သမျှ",
"prompts.pool.kindestThing": "တစ်ယောက်ယောက်က ငါ့အတွက် အရမ်းစေတနာဖြင့် လုပ်ပေးခဲ့တာက",
"prompts.pool.nonNegotiable": "ကျနော်နဲ့ပက်သက်လာရင် ဘယ်လိုမှ ညှိနိုင်းဖို့မဖြစ်နိုင်တဲ့အကြောင်းအရာက",
"prompts.pool.changeMyMind": "ကျနော်ကိုယ်တိုင် စိတ်အပြောင်းအလဲဖြစ်စေနိုင်တဲ့ မသေချာတဲ့အကြောင်းအရာက",
"prompts.pool.lastHappyTears": "နောက်ဆုံး ဝမ်းသာမျက်ရည်ကျသွားချိန်က",
"prompts.pool.cryInCarSong": "ကားစီးရင် အမြဲနားထောင်ရတဲ့ သီချင်းက",
"prompts.pool.happyPlace": "ကျနော့် အတွက် ငြိမ်းချမ်းသာယာသောနေရာက",
"prompts.pool.whereIGoMyself": "မွန်းကြပ်မှတွေနဲ့ ပြောက်ဆုံသွားချိန် သွားချင်တဲ့နေရာ",
"prompts.pool.bffWhyDateMe": "ကျနော်နဲ့ dating လုပ်သင့်တဲ့ BFF ဖြစ်ဖို့ဆိုရင်",
"prompts.pool.irrationalFear": "အကြောင်းမရှိ မကြောက်သင့်ပေမယ့် အမြဲကြောက်တာတစ်ခုပြောရရင်",
"prompts.pool.comfortFood": "စိတ်အေးလက်အေး စားချင်တိုင်း စားတဲ့အစားအစာ",
"prompts.pool.mostSpontaneous": "အမှတ်မထင်ဘဲ အတွေးပေါက်ပြီး လုပ်ခဲ့တာအကြီးဆုံးအရာ",
"prompts.pool.socialCause": "ငါ စိတ်ဝင်စားတဲ့ လူမှုရေးကိစ္စဆိုတာ",
"prompts.pool.factSurprises": "လူတွေ ကိုအံ့အားသင့်စေတဲ့ ကျနော့်အကြောင်းအရာတစ်ခု",
"prompts.pool.hobbyRecent": "မကြာသေးမီက သိလိုက်တဲ့ ငါ့ရဲ့ဝါသနာက",
"prompts.pool.dinnerWithAnyone": "ဘယ်သူ့နဲ့ ညစာစားချင်သလဲဆိုရင်…",
"prompts.pool.knownFor": "လူတွေက ကျနော့်ကို သိထားတာက",
"prompts.pool.wishLanguage": "အရမ်းပြောတတ်ချင်တဲ့ ဘာသာစကားတစ်ခု",
"prompts.pool.repeatMovie": "ထပ်ထပ်ကြည့်လို့ မရိုးသေးတဲ့ ရုပ်ရှင်",
"prompts.pool.lifeSong": "ကျနော့်ဘဝကို ဖော်ပြပေးတဲ့ သီချင်း",
"prompts.pool.adventurousPlace": "ခရီးသွားထားသမျှထဲ အကြီးဆုံး စွန့်စားခန်းက",
"prompts.pool.mostUsedApp": "ဖုန်းထဲမှာ အများဆုံး သုံးတဲ့ app",

// Religion page
"rel.title": "ကိုးကွယ်သည့် ယုံကြည်မှု ဘာလဲ?",
"rel.nextAria": "ရှေ့သို့",
"rel.opt.agnostic": "မိမိကိုယ်သာကိုးကွယ်ခြင်း",
"rel.opt.atheist": "ယုံကြည်မှုဘာသာမရှိပါ",
"rel.opt.buddhist": "ဗုဒ္ဓဘာသာ",
"rel.opt.catholic": "ကက်သလစ်ဘာသာ",
"rel.opt.christian": "ခရစ်ယာန်ဘာသာ",
"rel.opt.hindu": "ဟိန္ဒူဘာသာ",
"rel.opt.jewish": "ဂျူးဘာသာ",
"rel.opt.deity": "နတ်ကိုးကွယ်မှု",
"rel.opt.muslim": "အစ္စလမ်ဘာသာ",

// School page
"school.title": "ဘယ် ကျောင်းများမှာ သင်ယူခဲ့ပါသလဲ?",
"school.inputPH": "ကျောင်းအမည်",
"school.add": "ကျောင်းအသစ် ထည့်ရန်",
"school.removeAria": "ကျောင်းကို ဖယ်ရှားရန်",
"school.nextAria": "ရှေ့သို့",

// Sexuality page
"sex.title": "သင့် လိင်ပိုင်းဆိုင်ရာ စိတ်ဆန္ဒအခြေအနေ (sexuality) ဘယ်လိုလဲ?",
"sex.feedback": "Sexuality အကြောင်း အကြံပြုချက် ပေးမလား?",
"sex.nextAria": "ရှေ့သို့",
"sex.opt.na": "မပြောလိုပါ",
"sex.opt.straight": "ဆန့်ကျင်ဘက်လိင်ကို နှစ်သက်ခြင်း",
"sex.opt.gay": "အမျိုးသားချင်း နှစ်သက်ခြင်း",
"sex.opt.lesbian": "အမျိုးသမီးချင်း နှစ်သက်ခြင်း",
"sex.opt.bisexual": "ကျား၊ မ နှစ်မျိုးလုံးကို နှစ်သက်ခြင်း",
"sex.opt.allosexual": "အမျိုးသမီးကိုနှစ်သက်ခြင်း",
"sex.opt.androsexual": "အမျိုးသားကိုနှစ်သက်ခြင်း",

// Smoking page
"smoke.title": "ဆေးလိပ် သောက်ပါသလား?",
"smoke.nextAria": "ရှေ့သို့",
"smoke.opt.yes": "သောက်ပါတယ်",
"smoke.opt.sometimes": "တခါတရံသောက်ပါတယ်",
"smoke.opt.no": "မသောက်တတ်ပါ",
"smoke.opt.na": "မပြောလိုပါ",

// Voice Prompt page
"vp.step": "အဆင့် {cur}/{total}",
"vp.title": "ပရိုဖိုင်တွင် အသံ Prompt ထည့်ရန်",
"vp.pickTitle": "အသံ Prompt ရွေးချယ်ပါ",
"vp.loading": "ဖွင့်နေသည်…",
"vp.ready": "အသင့်ဖြစ်ပါသည်။ ပြန်ရိုက်ရန် (re‑record) သို့မဟုတ် သိမ်းစရာ ရှိသည်။",
"vp.rerecord": "ပြန်ရိုက်မည်",
"vp.tapStop": "ရပ်မည်",
"vp.tapStart": "စတင်မှတ်တမ်းတင်ပါ",
"vp.skip": "ကျော်လိုက်မည်",
"vp.nextAria": "ရှေ့သို့",
"vp.err.unsupported": "ဤ စက်/ဘရောက်ဇာတွင် မှတ်တမ်းတင်ခြင်းကို မပံ့ပိုးပါ။",
"vp.err.permission": "မိုင်ခရိုဖုန်း ခွင့်ပြုချက် ပယ်ချနှင့်/မရရှိနိုင်ပါ။",

// Voice prompt pool (my)
"vp.pool.rant": "ငါမနားမနေပြောနေမယ့် အကြောင်းက",
"vp.pool.favMemory": "ငါ့ အမှတ်တရ အကြိုက်ဆုံးဖြစ်ရပ်က",
"vp.pool.lastBigLaugh": "နောက်ဆုံး အရမ်းရယ်မိသွားချိန်က",
"vp.pool.bestAdvice": "ငါ့ရဲ့ အကောင်းဆုံး အကြံဉာဏ်တစ်ခုပါ",
"vp.pool.hiddenTalent": "ငါ့ လျှို့ဝှက် ကျွမ်းကျင်မှုက",
"vp.pool.perfectWeekend": "ပြီးပြည့်စုံသော ပိတ်ရက် က",
"vp.pool.desertIsland": "လူတွေဝေးတဲ့ကျွန်းတခုကိုသွားတယ်ဆိုရင် ယူသွားမယ့်အရာ",
"vp.pool.superpower": "စူပါပါဝါ တစ်ခု ရနိုင်မယ် ဆိုရင်",
"vp.pool.makesMeSmile": "ကျနော့်ကိုပြုံးရွင်နိုင်စေမယ့်အရာ",
"vp.pool.funFact": "ငါ့အကြောင်း ကောလဟာလ သိသင့်သည့် အချက်လေး",

// Weed page
"weed.title": "ဝိ သောက်သလား?",
"weed.nextAria": "ရှေ့သို့",
"weed.opt.yes": "သောက်ပါတယ်",
"weed.opt.sometimes": "တခါတရံသောက်ပါတယ်",
"weed.opt.no": "မသောက်တတ်ပါ",
"weed.opt.na": "မပြောလိုပါ",

// Work page
"work.title": "ဘယ်မှာ အလုပ်လုပ်ပါသလဲ?",
"work.placeholder": "အလုပ်လုပ်နေသော နေရာကို ရိုက်ထည့်ပါ",
"work.nextAria": "ရှေ့သို့",

// Account & Security
"acct.title": "အကောင့်နှင့် လုံခြုံရေး",
"acct.common.current": "လက်ရှိ:",
"acct.common.notSet": "မသတ်မှတ်ထားသေး",
"acct.common.sending": "ပို့နေသည်...",
"acct.common.verifying": "စစ်ဆေးနေသည်...",
"acct.common.err.start": "ပြောင်းလဲမှု စတင်မှု မအောင်မြင်ပါ။",
"acct.common.err.confirm": "အတည်ပြုမှု မအောင်မြင်ပါ။",
"acct.common.err.network": "လိုင်း ပြဿနာ ဖြစ်နေသည်။",
"acct.common.ph.confirmPwd": "စကားဝှက် အတည်ပြု",
"acct.common.ph.code6": "ကုဒ် ၆ လုံး",

// Email
"acct.email.title": "အီးမေးလ်",
"acct.email.ph.new": "အီးမေးလ်အသစ်",
"acct.email.cta.send": "အီးမေးလ်အသစ်သို့ ကုဒ်ပို့ရန်",
"acct.email.cta.confirm": "အီးမေးလ်ပြောင်းလဲမှု အတည်ပြုရန်",
"acct.email.err.enterNewAndPwd": "အီးမေးလ်အသစ်နှင့် စကားဝှက် ထည့်ပါ။",
"acct.email.err.enterCodeAndPwd": "ကုဒ်နှင့် စကားဝှက် ထည့်ပါ။",
"acct.email.msg.codeSent": "အီးမေးလ်အသစ်သို့ ကုဒ် ပို့ပြီးပါပြီ။",
"acct.email.msg.updated": "အီးမေးလ် ပြောင်းပြီးပါပြီ။",

// Phone
"acct.phone.title": "ဖုန်း",
"acct.phone.ph.newMm": "ဖုန်းနံပါတ်အသစ် (ဥပမာ 09xxxxxxxxx)",
"acct.phone.cta.send": "ဖုန်းသို့ ကုဒ်ပို့ရန်",
"acct.phone.cta.confirm": "ဖုန်းပြောင်းလဲမှု အတည်ပြုရန်",
"acct.phone.err.enterNewAndPwd": "ဖုန်းအသစ်နှင့် စကားဝှက် ထည့်ပါ။",
"acct.phone.err.enterCodeAndPwd": "ကုဒ်နှင့် စကားဝှက် ထည့်ပါ။",
"acct.phone.msg.codeSent": "ဖုန်းအသစ်သို့ ကုဒ် ပို့ပြီးပါပြီ။",
"acct.phone.msg.updated": "ဖုန်းနံပါတ် ပြောင်းပြီးပါပြီ။",

// === Dating Preferences (my) ===
"settings.label": "Settings",

"prefs.title": "အရည်အသွေး ရွေးချယ်ခြင်း",
"prefs.quickfill": "မိမိ၏ ပရိုဖိုင်မှ ဖြည့်သွင်းမည်",
"prefs.ageRange": "အသက်အပိုင်းအခြား",
"prefs.min": "အနည်းဆုံး",
"prefs.max": "အများဆုံး",
"prefs.showMe": "ပြသမည်",
"prefs.distance": "အကွာအဝေး",
"prefs.km": "ကီလိုမီတာ",
"prefs.relationship": "တွေ့ဆုံရေး ရည်ရွယ်ချက်",
"prefs.educationOpt": "ပညာအရည်အချင်း (မဖြစ်မနေ မဟုတ်ပါ)",
"prefs.ethnicityOpt": "တိုင်းရင်းသား (မဖြစ်မနေ မဟုတ်ပါ)",
"prefs.habits": "အသုံးအစွဲများ",
"prefs.smoking": "ဆေးလိပ်",
"prefs.drinking": "အရက်",
"prefs.weed": "ဝိ",
"prefs.drugs": "ဆေးဝါး",
"prefs.religionOpt": "ကိုးကွယ်မှု (မဖြစ်မနေ မဟုတ်ပါ)",
"prefs.politicsOpt": "နိုင်ငံရေး သဘောထား (မဖြစ်မနေ မဟုတ်ပါ)",
"prefs.familyPlansOpt": "မိသားစု အစီအစဉ် (မဖြစ်မနေ မဟုတ်ပါ)",
"prefs.quality": "အရည်အသွေး",
"prefs.verifiedOnly": "အတည်ပြုထားသော ပရိုဖိုင်များသာ",
"prefs.hasVoice": "အသံ Prompt ပါဝင်ရပါမည်",
"prefs.savePrefs": "မှတ်တမ်းတင်မည်",

"prefs.lock.title": "MyanMatchX လိုအပ်ပါသည်",
"prefs.lock.desc": "အကွာအဝေး၊ အသုံးအစွဲ၊ ကိုးကွယ်မှု၊ နိုင်ငံရေး၊ မိသားစုအစီအစဉ် စသည်တို့အပါအဝင် အဆင့်မြင့် filter များကို ဖွင့်နိုင်မည်။",
"prefs.lock.cta": "X သို့ အဆင့်မြှင့်မည်",

"prefs.err.ageRange": "အနည်းဆုံး အသက်သည် အများဆုံး အသက်ထက် မကျော်သင့်ပါ။",

"prefs.toast.prefilled": "ဖြည့်သွင်းပြီး ✓",
"prefs.toast.saved": "သိမ်းပြီး ✓",
"prefs.toast.saveFail": "သိမ်းထဲမနိုင်ပါ",

// commons used by DP
"common.back": "နောက်သို့",
"common.save": "Save",
"common.saving": "သိမ်းနေသည်…",
"auth.signInFirst": "အရင် စာရင်းဝင်ပါ။",

// --- Display labels for options (my) ---
// genders
"prefs.opt.gender.man": "အမျိုးသား",
"prefs.opt.gender.woman": "အမျိုးသမီး",
"prefs.opt.gender.nonbinary": "ဒွိလိင်",

// relationship
"prefs.opt.relationship.life_partner": "ဘဝတွဲဖော်",
"prefs.opt.relationship.long_term_relationship": "‌ေရရှည်ကာလ ဆက်ဆံရေး",
"prefs.opt.relationship.long_term_relationship_open_to_short": "ရေရှည်ကာလ မျှော်လင့်ပေမယ့်၊ ရေတိုလည်း အဆင်ပြေ",
"prefs.opt.relationship.short_term_relationship_open_to_long": "ရေတိုကာလ မျှော်လင့်ပေမယ့်၊ ရေရှည်လည်း အဆင်ပြေ",
"prefs.opt.relationship.short_term_relationship": "အချိန်တို ဆက်ဆံရေး",
"prefs.opt.relationship.friendship": "မိတ်ဆွေမှု",
"prefs.opt.relationship.figuring_out_my_dating_goals": "တွေ့ဆုံရေး ရည်ရွယ်ချက်ကို စဉ်းစားနေဆဲ",
"prefs.opt.relationship.prefer_not_to_say": "မပြောလိုပါ",

// religion
"prefs.opt.religion.agnostic": "မိမိကိုယ်သာကိုးကွယ်ခြင်း",
"prefs.opt.religion.atheist": "ယုံကြည်မှုဘာသာမရှိ",
"prefs.opt.religion.buddhist": "ဗုဒ္ဓဘာသာ",
"prefs.opt.religion.catholic": "ကက်သလစ်ဘာသာ",
"prefs.opt.religion.christian": "ခရစ်ယာန်ဘာသာ",
"prefs.opt.religion.hindu": "ဟိန္ဒူဘာသာ",
"prefs.opt.religion.jewish": "ဂျူးဘာသာ",
"prefs.opt.religion.deity": "နတ်ကိုးကွယ်မှု",
"prefs.opt.religion.muslim": "အစ္စလမ်ဘာသာ",

// politics
"prefs.opt.politics.liberal": "လွတ်လပ်လက်ဝဲမူဝါဒ",
"prefs.opt.politics.moderate": "ကြားနေမူဝါဒ",
"prefs.opt.politics.conservative": "ထိန်းသိမ်းလက်ယာမူဝါဒ",
"prefs.opt.politics.not_political": "နိုင်ငံရေး မတက်ကြွ",
"prefs.opt.politics.other": "အခြား",
"prefs.opt.politics.prefer_not_to_say": "မပြောလိုပါ",

// family plans
"prefs.opt.family.don_t_want_children": "ကလေး မလိုချင်ပါ",
"prefs.opt.family.want_children": "ကလေး လိုချင်ပါတယ်",
"prefs.opt.family.open_to_children": "ကလေး ရှိရှိ/မရှိရှိ အဆင်ပြေ",
"prefs.opt.family.not_sure_yet": "မသေချာသေး",
"prefs.opt.family.prefer_not_to_say": "မပြောလိုပါ",

// ethnicity
"prefs.opt.ethnicity.bamar": "ဗမာ",
"prefs.opt.ethnicity.karen_kayin": "ကရင်",
"prefs.opt.ethnicity.shan": "ရှမ်း",
"prefs.opt.ethnicity.kachin": "ကချင်",
"prefs.opt.ethnicity.mon": "မွန်",
"prefs.opt.ethnicity.chin": "ချင်း",
"prefs.opt.ethnicity.rakhine_arakanese": "ရခိုင်",
"prefs.opt.ethnicity.kayah_karenni": "ကယား(ကရင်နီ)",
"prefs.opt.ethnicity.other_myanmar_ethnic": "အခြားတိုင်းရင်းသား",
"prefs.opt.ethnicity.chinese": "တရုတ်",
"prefs.opt.ethnicity.indian": "အိန္ဒိယ",
"prefs.opt.ethnicity.black_african_descent": "အာဖရိကန်",
"prefs.opt.ethnicity.east_asian": "အရှေ့အာရှ",
"prefs.opt.ethnicity.south_asian": "တောင်အာရှ",
"prefs.opt.ethnicity.hispanic_latino": "ဟစ်စပန်နစ်/လက်တင်နို",
"prefs.opt.ethnicity.middle_eastern": "အလယ်အာရှ",
"prefs.opt.ethnicity.native_american": "နေးတီးဗ် အမေရိကန်",
"prefs.opt.ethnicity.pacific_islander": "ပစိဖိတ် ကျွန်းသား",
"prefs.opt.ethnicity.white_caucasian": "လူဖြူ(ကောက်ကေးရှင်း)",
"prefs.opt.ethnicity.other": "အခြား",

// yes/no/sometimes + No preference
"prefs.opt.yn.yes": "ဟုတ်ပါတယ်",
"prefs.opt.yn.sometimes": "တခါတရံ",
"prefs.opt.yn.no": "မလုပ်ပါ",
"prefs.opt.yn.prefer_not_to_say": "မပြောလိုပါ",
"prefs.opt.yn.no_preference": "မရွေးချယ်ပါ",

// education
"prefs.opt.edu.high_school": "အထက်တန်းအဆင့်",
"prefs.opt.edu.undergrad": "တက္ကသိုလ်အဆင့်",
"prefs.opt.edu.postgrad": "ဘွဲ့လွန်အဆင့်",
"prefs.opt.edu.prefer_not_to_say": "မပြောလိုပါ",
"prefs.opt.edu.no_preference": "မရွေးချယ်ပါ",

//EditProfilePage
  "edit": {
    "title": "Profile ပြင်ဆင်ခြင်း",
    "subtitle": "ပိုမိုကိုက်ညီတဲ့ မိတ်ဆွေတွေကိုတွေ့ဖို့ ပရိုဖိုင်းကို အနည်းငယ်ညှိပေးပါ။ ပြောင်းလဲမှုတွေကို မှတ်တမ်းတင်ပေးထားပါတယ်။",
    "save": "Save",
    "saving": "သိမ်းနေသည်…",
    "saveProfile": "ပရိုဖိုင်း သိမ်းမည်",
    "photos": {
      "title": "ဓာတ်ပုံများ",
      "hint": "ထည့်ရန်၊ အစီအစဉ်ပြောင်းရန် ဓါတ်ပုံကို ဆွဲရွှေ့ပါ",
      "caption": "ပထမဓာတ်ပုံဟာ ပင်မပုံ ဖြစ်မည်။ ဆွဲရွှေ့ပြီး အစီအစဉ်ပြောင်းနိုင်သည်။",
      "replaceTip": "အစားထိုးရန် နှိပ်ပါ",
      "drag": "ဆွဲ",
      "add": "ဓာတ်ပုံ ထည့်မည်"
    },
    "prompts": {
      "title": "Prompts ရေးပါ",
      "required": "ဖြေကြားချက် (၃) ခု လိုအပ်သည်",
      "prompt": "Prompt",
      "answer": "သင့်အဖြေ",
      "answerPH": "စိတ်ဝင်စားဖွယ်ရာ တစ်ခုရေးကြည့်ပါ…"
    },
    "voice": {
      "title": "အသံ Prompt",
      "hint": "အများဆုံး ၃၀ စက္ကန့်၊ သို့မဟုတ် လင့်ခ်ကို ထည့်သွင်းနိုင်သည်",
      "titlePH": "အသံ Prompt ခေါင်းစဉ် (ဥပမာ - “ကျွန်တော်/ကျွန်မရဲ့ နောက်ဆုံးသီတင်းပတ်”)",
      "sample": "နမူနာ ကြားမည်",
      "rerecord": "ပြန်တင်မည်",
      "remove": "ပရိုဖိုင်းမှ ဖယ်ရှားမည်",
      "useRecording": "ဤအသံစာရင်းကို သုံးမည် (upload)",
      "currentAudio": "ယခု ပရိုဖိုင်း အသံ",
      "tapStart": "မှတ်တမ်းတင်ရန် နှိပ်ပါ",
      "tapStop": "ရပ်ရန် နှိပ်ပါ",
      "err": {
        "unsupported": "ဤစက်/ဘရောက်ဇာ၌ မှတ်တမ်းတင်ခွင့် မပံ့ပိုးထားပါ။",
        "permission": "ဖုန်းမိုက်ကရိုဖုန်း ခွင့်ပြုမထားသဖြင့် မရရှိနိုင်ပါ။"
      },
      "toast": {
        "uploaded": "အသံကို အပ်လုဒ်ပြီး သင့်ပရိုဖိုင်းနှင့် ချိတ်ဆက်ပြီးပါပြီ။",
        "fail": "upload မအောင်မြင်ပါ။ 'onboarding' bucket အများပြည်သူမြင်ရမှုရှိ/ရှိမရှိ စစ်ဆေးပါ။"
      }
    },
    "vitals": {
      "title": "အခြေခံ အချက်အလက်",
      "firstName": "နာမည် (ပထမ)",
      "lastName": "နာမည် (အဆုံး)",
      "gender": "လိင်",
      "sexuality": "ဆွဲဆောင်မှု",
      "birthdate": "မွေးနေ့",
      "ageAuto": "အသက် (အလိုအလျောက်)",
      "height": "အမြင့်",
      "heightHint": "ဥပမာ - 5' 9\"",
      "location": "နေရာ",
      "hometown": "မွေးရပ်မြို့",
      "ethnicity": "လူမျိုးစု",
      "religion": "ကိုးကွယ်ဘာသာ",
      "children": "သားသမီး",
      "familyPlans": "မိသားစု အစီအစဉ်",
      "intention": "တွေ့ဆုံရန် ရည်ရွယ်ချက်",
      "schools": "ကျောင်းများ",
      "schoolPH": "ကျောင်းအမည်",
      "addSchool": "ကျောင်းတစ်ခု ထပ်ထည့်မည်",
      "removeSchoolAria": "ကျောင်း ဖယ်ရှားမည်",
      "education": "အတန်းပညာ",
      "job": "အလုပ်အကိုင်",
      "workplace": "အလုပ်နေရာ",
      "drinking": "အရက်သောက်ခြင်း",
      "smoking": "ဆေးလိပ်သောက်ခြင်း",
      "weed": "ဝိသုံးစွဲမှု",
      "drugs": "ဆေးဝါး",
      "politics": "နိုင်ငံရေး သဘောထား"
    },
    "common": {
      "change": "ပြောင်းလဲ",
      "remove": "ဖယ်ရှား",
      "selectPH": "ရွေးချယ်ပါ…"
    },
    "toast": {
      "photoFail": "ဓာတ်ပုံ အပ်လုဒ် မအောင်မြင်ပါ။ ထပ်ကြိုးစားကြည့်ပါ။",
      "saveFail": "သိမ်းဆည်းမှု မအောင်မြင်ပါ။ ထပ်ကြိုးစားကြည့်ပါ။",
      "saveOk": "ပရိုဖိုင်းကို သိမ်းပြီးပါပြီ!"
    },

    // ⬇️ add these siblings after the "edit" block inside STRINGS.my
    "download": {
      "title": "MyanMatch ကို ဒေါင်းလုဒ်ဆွဲပါ",
      "android": "အန်ဒရိုက်",
      "androidDesc": "အကောင်းဆုံးအသုံးပြုရန် Home Screen မှာ အက်ပ်ကိုထည့်သုံးပါ။",
      "installAndroid": "Android ပေါ်တွင် တပ်ဆင်မည်",
      "already": "ပြီးသား တပ်ဆင်ထားပြီးပါပြီ",
      "androidTip": "အကြံပြုချက် - Android တွင် Chrome သုံးပါ။ Button မပေါ်ပါက ⋮ မီနူးထဲမှ “Install app” သို့မဟုတ် “Add to Home screen” ကိုနှိပ်ပါ။",
      "ios": "iOS (iPhone)",
      "iosDesc": "Safari တွင် “Add to Home Screen” ဖြင့်တပ်ဆင်ပါ။",
      "iosStep1": "၁) Safari တွင် Share ခလုတ်ကိုနှိပ်ပါ။",
      "iosStep2": "၂) “Add to Home Screen” ကိုရွေးပါ။",
      "iosStep3": "၃) “Add” ကိုနှိပ်ပြီးပြီးဆုံးပါမည်။",
      "iosNote": "မှတ်ချက် — iOS တွင် PWA ကို Safari မှသာ တပ်ဆင်နိုင်သည်။ အခြား browser သုံးနေပါက Safari ဖြင့်ဖွင့်ပါ။"
    },
    "profile": {
      "about": "အကြောင်းအရာ"
    },
    "msg": {
      "alreadyInstalled": "✅ ဤစက်တွင် အက်ပ်တပ်ဆင်ပြီးသား ဖြစ်ပါသည်။",
      "noPrompt": "ဘာမှ မဖြစ်လျှင် Android တွင် Chrome ဖြင့်ဖွင့်ပါ သို့မဟုတ် browser မီနူးမှ Home Screen သို့ ထည့်ရန်/Install app ကိုနှိပ်ပါ။",
      "installing": "📲 တပ်ဆင်နေပါပြီ… Home Screen ကို စစ်ဆေးပါ။",
      "dismissed": "တပ်ဆင်ခြင်းကို ပယ်ချခဲ့ပါတယ်။ မည်သည့်အချိန်မဆို နောက်တစ်ခါ ပြန်ကြိုးစားနိုင်ပါတယ်။",
      "failed": "တပ်ဆင်မှု မအောင်မြင်ပါ။ ထပ်ကြိုးစားပါ။"
    },
    "alt": {
      "share": "Safari တွင် Share ခလုတ်ကို နှိပ်ပါ",
      "addToHome": "Add to Home Screen ကို ရွေးပါ",
      "confirmAdd": "Add ကိုနှိပ်ပြီး အတည်ပြုပါ"
    }

  },
};

function deepGet(obj, path) {
  if (!obj) return undefined;
  const parts = String(path).split(".");
  let cur = obj;
  for (const p of parts) {
    if (cur && Object.prototype.hasOwnProperty.call(cur, p)) cur = cur[p];
    else return undefined;
  }
  return cur;
}

function format(template, params) {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) => params[k] ?? "");
}

export function I18nProvider({ children }) {
const [lang, setLang] = useState(() => {
  // Prefer explicit key; fall back to user blob; else "en"
  const stored = localStorage.getItem("myanmatch_lang");
  if (stored) return stored;
  try {
    const local = JSON.parse(localStorage.getItem("myanmatch_user") || "{}");
    return local.language || "en";
  } catch { return "en"; }
});

// keep localStorage in sync + <html lang> + cross-tab ping
useEffect(() => {
  try {
    localStorage.setItem("myanmatch_lang", lang);
    const local = JSON.parse(localStorage.getItem("myanmatch_user") || "{}");
    local.language = lang;
    localStorage.setItem("myanmatch_user", JSON.stringify(local));
  } catch {}
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("lang", lang);
  }
  // notify other tabs in same window context
  window.dispatchEvent(new CustomEvent("myanmatch-lang", { detail: lang }));
}, [lang]);

// react to lang changes from other tabs / windows
useEffect(() => {
  const onStorage = (e) => {
    if (e.key === "myanmatch_lang" && e.newValue && e.newValue !== lang) {
      setLang(e.newValue);
    }
  };
  const onCustom = (e) => {
    if (e?.detail && e.detail !== lang) setLang(e.detail);
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener("myanmatch-lang", onCustom);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("myanmatch-lang", onCustom);
  };
}, [lang]);


const t = useMemo(() => {
  return (key, params) => {
    const table = STRINGS[lang] || STRINGS.en;

    // 1) try nested path like "edit.photos.title"
    // 2) fall back to flat keys that literally include dots ("settings.title")
    // 3) fall back to English
    const raw =
      deepGet(table, key) ??
      table[key] ??
      deepGet(STRINGS.en, key) ??
      STRINGS.en[key] ??
      key;

    return typeof raw === "string" ? format(raw, params) : key;
  };
}, [lang]);


  const value = useMemo(() => ({ lang, setLang, t }), [lang, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
