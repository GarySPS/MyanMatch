import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboarding } from "../../context/OnboardingContext";

function Section({ title, titleMm, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl bg-white/8 ring-1 ring-white/15 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="font-semibold">
          {title}
          <span className="block text-white/80 font-normal">{titleMm}</span>
        </span>
        <span
          className={`transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          ▼
        </span>
      </button>
      {open && <div className="px-5 pb-5 text-sm text-white/90">{children}</div>}
    </div>
  );
}

export default function TermsPage() {
  const navigate = useNavigate();
  const { setProfileData } = useOnboarding();
  const [agree, setAgree] = useState(false);

  return (
    <div className="min-h-screen relative flex items-center justify-center px-6 py-10">
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#3a0224] via-[#2a0018] to-[#190011]"
        aria-hidden
      />
      <div className="relative w-full max-w-md text-white">
        <img
          src="/images/myanmatch-logo.png"
          alt="MyanMatch"
          className="mx-auto w-44 h-44 rounded-full shadow-xl ring-1 ring-white/10 mb-6 object-cover"
        />

        <h1 className="text-3xl font-extrabold tracking-tight text-center mb-2">
          MyanMatch Terms & Policies
          <p className="text-2xl mt-1">စည်းမျဉ်းများနှင့် မူဝါဒများ</p>
        </h1>
        <p className="text-center text-white/80 mb-6">
          MyanMatch is for making friends online. It’s suitable for all ages.
          Please read these short guidelines before continuing.
          <br />
          <span className="mt-1 block">
            MyanMatch သည် သူငယ်ချင်းများဖွဲ့ရန်အတွက် ဖြစ်သည်။ အသက်အရွယ်မရွေး
            သင့်တော်ပါသည်။ မဆက်လက်မီ ဤလမ်းညွှန်ချက်တိုများကို ဖတ်ရှုပါ။
          </span>
        </p>

        <div className="space-y-3">
          <Section
            title="1) Community Guidelines"
            titleMm="အသိုင်းအဝိုင်း လမ်းညွှန်ချက်များ"
            defaultOpen
          >
            <ul className="list-disc pl-5 space-y-2">
              <li>
                Be kind and respectful. No bullying, hate speech, or harassment.
                <p className="text-white/80">ကြင်နာပြီး လေးစားမှုရှိပါ။ အနိုင်ကျင့်ခြင်း၊ မုန်းတီးစကားပြောခြင်း သို့မဟုတ် နှောင့်ယှက်ခြင်းမပြုရ။</p>
              </li>
              <li>
                No nudity, sexual content, or adult services. This is not an
                18+ app.
                <p className="text-white/80">ဝတ်လစ်စားလစ်၊ လိင်ပိုင်းဆိုင်ရာ အကြောင်းအရာ သို့မဟုတ် လူကြီးဝန်ဆောင်မှုများ မပါဝင်ရ။ ၎င်းသည် 18+ အက်ပ်မဟုတ်ပါ။</p>
              </li>
              <li>
                No threats, violence, scams, or impersonation.
                <p className="text-white/80">ခြိမ်းခြောက်ခြင်း၊ အကြမ်းဖက်ခြင်း၊ လိမ်လည်ခြင်း သို့မဟုတ် အယောင်ဆောင်ခြင်းမပြုရ။</p>
              </li>
              <li>
                Use your own photos and only post content you have rights to
                share.
                 <p className="text-white/80">သင့်ကိုယ်ပိုင်ဓာတ်ပုံများကိုသာ အသုံးပြုပြီး မျှဝေခွင့်ရှိသော အကြောင်းအရာများကိုသာ တင်ပါ။</p>
              </li>
              <li>
                Keep conversations friendly and inclusive of all ages and
                backgrounds.
                <p className="text-white/80">စကားပြောဆိုမှုများကို ဖော်ရွေစွာထားပြီး အသက်အရွယ်နှင့် နောက်ခံအားလုံးကို အားလုံးပါဝင်အောင် ပြုလုပ်ပါ။</p>
              </li>
            </ul>
          </Section>

          <Section title="2) Safety Rules" titleMm="လုံခြုံရေး စည်းမျဉ်းများ">
            <ul className="list-disc pl-5 space-y-2">
              <li>
                Protect personal info: don’t share address, school, or
                financial details.
                <p className="text-white/80">ကိုယ်ရေးကိုယ်တာအချက်အလက်များကို ကာကွယ်ပါ- လိပ်စာ၊ ကျောင်း သို့မဟုတ် ငွေကြေးဆိုင်ရာအသေးစိတ်အချက်အလက်များကို မမျှဝေပါနှင့်။</p>
              </li>
              <li>
                Meet new people in public places and tell a trusted person if
                you plan to meet.
                <p className="text-white/80">လူသစ်များနှင့် အများပြည်သူဆိုင်ရာနေရာများတွင် တွေ့ဆုံပြီး တွေ့ဆုံရန်စီစဉ်ထားပါက ယုံကြည်ရသောသူတစ်ဦးကို ပြောပြပါ။</p>
              </li>
              <li>
                Report and block anyone who makes you uncomfortable.
                <p className="text-white/80">သင့်ကို မသက်မသာဖြစ်စေသူတိုင်းကို တိုင်ကြားပြီး ပိတ်ဆို့ပါ။</p>
              </li>
              <li>
                If you are under 13, use MyanMatch only with a parent/guardian
                and never chat privately with adults you don’t know.
                <p className="text-white/80">သင်သည် အသက် ၁၃ နှစ်အောက်ဖြစ်ပါက၊ MyanMatch ကို မိဘ/အုပ်ထိန်းသူနှင့်အတူသာ အသုံးပြုပြီး သင်မသိသော လူကြီးများနှင့် သီးသန့်စကားမပြောပါနှင့်။</p>
              </li>
            </ul>
          </Section>

          <Section title="3) Content & Conduct We Don’t Allow" titleMm="ကျွန်ုပ်တို့ ခွင့်မပြုသော အကြောင်းအရာနှင့် အပြုအမူ">
            <ul className="list-disc pl-5 space-y-2">
              <li>
                Adult/sexual content, requests for pics, or romantic pressure.
                <p className="text-white/80">လူကြီး/လိင်ပိုင်းဆိုင်ရာ အကြောင်းအရာ၊ ဓာတ်ပုံတောင်းဆိုမှုများ သို့မဟုတ် ရိုမန်းတစ်ဖိအားပေးမှုများ။</p>
              </li>
              <li>
                Spam, misleading links, fake giveaways, or phishing.
                <p className="text-white/80">စပမ်း၊ လမ်းလွှဲစေသော လင့်ခ်များ၊ အတုအယောင်လက်ဆောင်များ သို့မဟုတ် phishing များ။</p>
              </li>
              <li>
                Hate speech, illegal activity, or promotion of self‑harm.
                <p className="text-white/80">မုန်းတီးစကားပြောခြင်း၊ တရားမဝင်လုပ်ဆောင်မှု သို့မဟုတ် မိမိကိုယ်ကို အန္တရာယ်ပြုမှုကို အားပေးခြင်း။</p>
              </li>
              <li>
                Buying/selling accounts or using automation/bots.
                <p className="text-white/80">အကောင့်များ ဝယ်ခြင်း/ရောင်းခြင်း သို့မဟုတ် အလိုအလျောက်စနစ်/ဘော့တ်များ အသုံးပြုခြင်း။</p>
              </li>
            </ul>
          </Section>

          <Section title="4) Privacy Policy (Short)" titleMm="ကိုယ်ရေးကိုယ်တာ မူဝါဒ (အကျဉ်း)">
            <ul className="list-disc pl-5 space-y-2">
              <li>
                We collect basic profile data (name, age range, photos), app
                usage, and optional location (city/township) to improve
                matches and safety.
                <p className="text-white/80">သင့်တော်သောသူများနှင့် ချိတ်ဆက်ပေးနိုင်ရန်နှင့် လုံခြုံရေးတိုးတက်စေရန်အတွက် အခြေခံပရိုဖိုင်အချက်အလက်များ (အမည်၊ အသက်၊ ဓာတ်ပုံ)၊ အက်ပ်အသုံးပြုမှုနှင့် တည်နေရာ (မြို့/မြို့နယ်) ကို စုဆောင်းပါသည်။</p>
              </li>
              <li>
                Your precise GPS is not shown to others; only a city/township
                label may be shown.
                <p className="text-white/80">သင်၏ တိကျသော GPS တည်နေရာကို အခြားသူများအား မပြသပါ၊ မြို့/မြို့နယ် အညွှန်းကိုသာ ပြသနိုင်ပါသည်။</p>
              </li>
              <li>
                We don’t sell your personal data. We may use trusted providers
                to run the app (e.g., storage/analytics) under confidentiality.
                <p className="text-white/80">ကျွန်ုပ်တို့သည် သင်၏ကိုယ်ရေးကိုယ်တာအချက်အလက်များကို မရောင်းချပါ။ အက်ပ်လည်ပတ်ရန်အတွက် ယုံကြည်ရသော ဝန်ဆောင်မှုပေးသူများ (ဥပမာ- သိုလှောင်မှု/သုံးသပ်ချက်) ကို လျှို့ဝှက်စွာ အသုံးပြုနိုင်ပါသည်။</p>
              </li>
              <li>
                You can request to download or delete your data via Settings.
                <p className="text-white/80">ဆက်တင်များမှတစ်ဆင့် သင်၏ဒေတာကို ဒေါင်းလုဒ်လုပ်ရန် သို့မဟုတ် ဖျက်ရန် တောင်းဆိုနိုင်သည်။</p>
              </li>
            </ul>
          </Section>
        </div>

        <div className="mt-6 space-y-3">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="mt-1 h-5 w-5 rounded accent-pink-500"
            />
            <span className="text-sm text-white/90">
              I’ve read and agree to the Terms, Privacy, Cookies, and Safety
              rules above. I will use MyanMatch respectfully.
              <p className="mt-1">
                MyanMatch ရဲ့စည်းမျဉ်းစည်းကမ်းများကိုဖတ်ရှုပြီး
                တစ်ဦးနှင့်တစ်ဦးလေးစားမှုနှင့်ပြောဆိုပါမည်ဟု
                သဘောတူပါက အမှန်ခြစ်ပေးပါ။
              </p>
            </span>
          </label>

          <button
            onClick={() => {
              if (!agree) return;
              setProfileData((prev) => ({ ...prev, agreedToTerms: true }));
              navigate("/onboarding/language");
            }}
            disabled={!agree}
            className={`w-full rounded-full py-4 text-lg font-semibold shadow-lg transition
              ${
                agree
                  ? "bg-gradient-to-r from-pink-500 to-purple-500 active:scale-[0.99]"
                  : "bg-white/20 text-white/60 cursor-not-allowed"
              }`}
          >
            Agree & Continue
            <span className="block text-base font-normal">သဘောတူပြီး ဆက်လက်လုပ်ဆောင်ပါ</span>
          </button>
        </div>
      </div>
    </div>
  );
}