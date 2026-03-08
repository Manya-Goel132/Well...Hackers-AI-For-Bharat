
import json
import os

locales_dir = "/Users/jai/Downloads/Mann-Mitra-main-SHUBH new  4/New Version 3/ManoSathi1.0/src/locales"

# Define the new content for each language
updates = {
    "bn": {
        "nav_continue": "চালিয়ে যান",
        "change": "পরিবর্তন করুন",
        "interests_placeholder": "যেমন সঙ্গীত, পড়া, যোগব্যায়াম",
        "onboarding": {
            "title": "মনোসাতীতে স্বাগতম",
            "subtitle": "আপনার অভিজ্ঞতা ব্যক্তিগত করতে আসুন আপনাকে আরও ভালভাবে জানি।",
            "required_fields": "অনুগ্রহ করে সমস্ত প্রয়োজনীয় ক্ষেত্র পূরণ করুন",
            "success": "মনোসাতীতে স্বাগতম!",
            "error": "কিছু ভুল হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।",
            "goals_label": "আপনাকে মনোসাতীতে কী নিয়ে এসেছে?",
            "goals_placeholder": "আমি মানসিক চাপ কমাতে চাই, ঘুমের উন্নতি করতে চাই, ইত্যাদি...",
            "interests_hint": "কমা দিয়ে আলাদা করুন",
            "complete_btn": "সেটআপ সম্পূর্ণ করুন"
        }
    },
    "ta": {
        "nav_continue": "தொடரவும்",
        "change": "மாற்றவும்",
        "interests_placeholder": "எ.கா. இசை, வாசிப்பு, யோகா",
        "onboarding": {
            "title": "மனோசாதிக்கு வரவேற்கிறோம்",
            "subtitle": "உங்கள் அனுபவத்தைத் தனிப்பயனாக்க உங்களை நன்கு புரிந்துகொள்வோம்.",
            "required_fields": "தயவுசெய்து அனைத்து கட்டாய புலங்களையும் நிரப்பவும்",
            "success": "மனோசாதிக்கு வரவேற்கிறோம்!",
            "error": "ஏதோ தவறு நடந்துவிட்டது. மீண்டும் முயற்சிக்கவும்.",
            "goals_label": "உங்களை மனோசாதிக்கு அழைத்து வந்தது எது?",
            "goals_placeholder": "நான் மன அழுத்தத்தைக் குறைக்க விரும்புகிறேன், தூக்கத்தை மேம்படுத்த விரும்புகிறேன்...",
            "interests_hint": "காற்புள்ளிகளால் பிரிக்கவும்",
            "complete_btn": "அமைப்பை முடிக்கவும்"
        }
    },
    "te": {
        "nav_continue": "కొనసాగించండి",
        "change": "మార్చండి",
        "interests_placeholder": "ఉదా. సంగీతం, పఠనం, యోగా",
        "onboarding": {
            "title": "మనోసాథికి స్వాగతం",
            "subtitle": "మీ అనుభవాన్ని వ్యక్తిగతీకరించడానికి మిమ్మల్ని బాగా తెలుసుకుందాం.",
            "required_fields": "దయచేసి అన్ని అవసరమైన ఫీల్డ్‌లను పూరించండి",
            "success": "మనోసాథికి స్వాగతం!",
            "error": "ఏదో తప్పు జరిగింది. దయచేసి మళ్లీ ప్రయత్నించండి.",
            "goals_label": "మనోసాథికి మిమ్మల్ని ఏది తీసుకువచ్చింది?",
            "goals_placeholder": "నేను ఒత్తిడిని తగ్గించుకోవాలి, నిద్రను మెరుగుపరచుకోవాలి...",
            "interests_hint": "కామాలతో వేరు చేయండి",
            "complete_btn": "సెటప్ పూర్తి చేయండి"
        }
    },
    "gu": {
        "nav_continue": "ચાલુ રાખો",
        "change": "બદલો",
        "interests_placeholder": "દા.ત. સંગીત, વાંચન, યોગ",
        "onboarding": {
            "title": "મનોસાથીમાં આપનું સ્વાગત છે",
            "subtitle": "તમારા અનુભવને વ્યક્તિગત કરવા માટે ચાલો તમને વધુ સારી રીતે ઓળખીએ.",
            "required_fields": "કૃપા કરીને બધા જરૂરી ક્ષેત્રો ભરો",
            "success": "મનોસાથીમાં આપનું સ્વાગત છે!",
            "error": "કંઈક ખોટું થયું. કૃપા કરીને ફરી પ્રયાસ કરો.",
            "goals_label": "તમને મનોસાથી સુધી શું લાવ્યું?",
            "goals_placeholder": "હું તણાવ ઘટાડવા માંગું છું, ઊંઘ સુધારવા માંગું છું...",
            "interests_hint": "અલ્પવિરામથી અલગ કરો",
            "complete_btn": "સેટઅપ પૂર્ણ કરો"
        }
    },
    "kn": {
        "nav_continue": "ಮುಂದುವರಿಸಿ",
        "change": "ಬದಲಾಯಿಸಿ",
        "interests_placeholder": "ಉದಾ. ಸಂಗೀತ, ಓದುವಿಕೆ, ಯೋಗ",
        "onboarding": {
            "title": "ಮನೋಸಾಥಿಗೆ ಸುಸ್ವಾಗತ",
            "subtitle": "ನಿಮ್ಮ ಅನುಭವವನ್ನು ವೈಯಕ್ತೀಕರಿಸಲು ನಿಮ್ಮನ್ನು ಚೆನ್ನಾಗಿ ತಿಳಿದುಕೊಳ್ಳೋಣ.",
            "required_fields": "ದಯವಿಟ್ಟು ಎಲ್ಲಾ ಅಗತ್ಯ ಕ್ಷೇತ್ರಗಳನ್ನು ಭರ್ತಿ ಮಾಡಿ",
            "success": "ಮನೋಸಾಥಿಗೆ ಸುಸ್ವಾಗತ!",
            "error": "ಏನೋ ತಪ್ಪಾಗಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
            "goals_label": "ನಿಮ್ಮನ್ನು ಮನೋಸಾಥಿಗೆ ಯಾವುದು ತಂದಿದೆ?",
            "goals_placeholder": "ನಾನು ಒತ್ತಡವನ್ನು ಕಡಿಮೆ ಮಾಡಲು ಬಯಸುತ್ತೇನೆ, ನಿದ್ರೆಯನ್ನು ಸುಧಾರಿಸಲು...",
            "interests_hint": "ಅಲ್ಪವಿರಾಮದಿಂದ ಬೇರ್ಪಡಿಸಿ",
            "complete_btn": "ಸೆಟಪ್ ಪೂರ್ಣಗೊಳಿಸಿ"
        }
    },
    "ml": {
        "nav_continue": "തുടരുക",
        "change": "മാറ്റുക",
        "interests_placeholder": "ഉദാഹരണത്തിന് സംഗീതം, വായന, യോഗ",
        "onboarding": {
            "title": "മനോസാഥിയിലേക്ക് സ്വാഗതം",
            "subtitle": "നിങ്ങളുടെ അനുഭവം വ്യക്തിഗതമാക്കാൻ ഞങ്ങൾക്ക് നിങ്ങളെ കൂടുതൽ അറിയാം.",
            "required_fields": "ദയവായി ആവശ്യമായ എല്ലാ ഫീൽഡുകളും പൂരിപ്പിക്കുക",
            "success": "മനോസാഥിയിലേക്ക് സ്വാഗതം!",
            "error": "എന്തോ കുഴപ്പം സംഭവിച്ചു. ദയവായി വീണ്ടും ശ്രമിക്കുക.",
            "goals_label": "എന്താണ് നിങ്ങളെ മനോസാഥിയിലേക്ക് കൊണ്ടുവന്നത്?",
            "goals_placeholder": "എനിക്ക് മാനസിക സമ്മർദ്ദം കുറക്കണം, ഉറക്കം മെച്ചപ്പെടുത്തണം...",
            "interests_hint": "കോമ ഉപയോഗിച്ച് വേർതിരിക്കുക",
            "complete_btn": "സജ്ജീകരണം പൂർത്തിയാക്കുക"
        }
    },
    "pa": {
        "nav_continue": "ਜਾਰੀ ਰੱਖੋ",
        "change": "ਬਦਲੋ",
        "interests_placeholder": "ਜਿਵੇਂ ਸੰਗੀਤ, ਪੜ੍ਹਨਾ, ਯੋਗਾ",
        "onboarding": {
            "title": "ਮਨੋਸਾਥੀ ਵਿੱਚ ਜੀ ਆਇਆਂ ਨੂੰ",
            "subtitle": "ਆਪਣੇ ਅਨੁਭਵ ਨੂੰ ਨਿੱਜੀ ਬਣਾਉਣ ਲਈ ਆਓ ਤੁਹਾਨੂੰ ਬਿਹਤਰ ਜਾਣੀਏ।",
            "required_fields": "ਕਿਰਪਾ ਕਰਕੇ ਸਾਰੇ ਲੋੜੀਂਦੇ ਖੇਤਰ ਭਰੋ",
            "success": "ਮਨੋਸਾਥੀ ਵਿੱਚ ਜੀ ਆਇਆਂ ਨੂੰ!",
            "error": "ਕੁਝ ਗਲਤ ਹੋ ਗਿਆ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।",
            "goals_label": "ਤੁਹਾਨੂੰ ਮਨੋਸਾਥੀ ਤੱਕ ਕੀ ਲਿਆਇਆ?",
            "goals_placeholder": "ਮੈਂ ਤਣਾਅ ਘਟਾਉਣਾ ਚਾਹੁੰਦਾ ਹਾਂ, ਨੀਂਦ ਵਿੱਚ ਸੁਧਾਰ ਕਰਨਾ ਚਾਹੁੰਦਾ ਹਾਂ...",
            "interests_hint": "ਕਾਮੇ ਨਾਲ ਵੱਖ ਕਰੋ",
            "complete_btn": "ਸੈੱਟਅੱਪ ਪੂਰਾ ਕਰੋ"
        }
    },
    "or": {
        "nav_continue": "ଜାରି ରଖନ୍ତୁ",
        "change": "ପରିବର୍ତ୍ତନ କରନ୍ତୁ",
        "interests_placeholder": "ଉଦାହରଣ ସ୍ୱରୂପ ସଂଗୀତ, ପଢିବା, ଯୋଗ",
        "onboarding": {
            "title": "ମନୋସାଥୀକୁ ସ୍ୱାଗତ",
            "subtitle": "ଆପଣଙ୍କ ଅନୁଭୂତିକୁ ବ୍ୟକ୍ତିଗତ କରିବା ପାଇଁ ଆସନ୍ତୁ ଆପଣଙ୍କୁ ଭଲ ଭାବରେ ଜାଣିବା।",
            "required_fields": "ଦୟାକରି ସମସ୍ତ ଆବଶ୍ୟକୀୟ କ୍ଷେତ୍ର ପୂରଣ କରନ୍ତୁ",
            "success": "ମନୋସାଥୀକୁ ସ୍ୱାଗତ!",
            "error": "କିଛି ଭୁଲ ହେଲା। ଦୟାକରି ପୁନର୍ବାର ଚେଷ୍ଟା କରନ୍ତୁ।",
            "goals_label": "ଆପଣଙ୍କୁ ମନୋସାଥୀକୁ କଣ ଆଣିଲା?",
            "goals_placeholder": "ମୁଁ ଚାପ କମ କରିବାକୁ ଚାହେଁ, ନିଦ ସୁଧାରିବାକୁ ଚାହେଁ...",
            "interests_hint": "କମା ଦ୍ୱାରା ପୃଥକ",
            "complete_btn": "ସେଟଅପ୍ ପୂରଣ କରନ୍ତୁ"
        }
    },
    "as": {
        "nav_continue": "অব্যাহত ৰাখক",
        "change": "সলনি কৰক",
        "interests_placeholder": "যেনে সংগীত, পঢ়া, যোগ",
        "onboarding": {
            "title": "মনোসাতীলৈ স্বাগতম",
            "subtitle": "আপোনাৰ অভিজ্ঞতা ব্যক্তিগত কৰিবলৈ আমি আপোনাক ভালদৰে জানো আহক।",
            "required_fields": "অনুগ্ৰহ কৰি সকলো প্ৰয়োজনীয় ক্ষেত্ৰ পূৰণ কৰক",
            "success": "মনোসাতীলৈ স্বাগতম!",
            "error": "কিবা ভুল হ'ল। অনুগ্ৰহ কৰি পুনৰ চেষ্টা কৰক।",
            "goals_label": "আপোনাক মনোসাতীলৈ কিহে আনিছে?",
            "goals_placeholder": "মই চাপ কমাব বিচাৰো, টোপনি উন্নত কৰিব বিচাৰো...",
            "interests_hint": "কমাৰ দ্বাৰা পৃথক",
            "complete_btn": "ছেটআপ সম্পূৰ্ণ কৰক"
        }
    },
    "ur": {
        "nav_continue": "جاری رکھیں",
        "change": "تبدیل کریں",
        "interests_placeholder": "مثلاً موسیقی، مطالعہ، یوگا",
        "onboarding": {
            "title": "منوساتھی میں خوش آمدید",
            "subtitle": "اپنے تجربے کو ذاتی بنانے کے لیے آئیے آپ کو بہتر جانتے ہیں۔",
            "required_fields": "براہ کرم تمام مطلوبہ فیلڈز پُر کریں",
            "success": "منوساتھی میں خوش آمدید!",
            "error": "کچھ غلط ہو گیا۔ براہ کرم دوبارہ کوشش کریں۔",
            "goals_label": "آپ کو منوساتھی تک کیا لایا؟",
            "goals_placeholder": "میں تناؤ کم کرنا چاہتا ہوں، نیند میں بہتری لانا چاہتا ہوں...",
            "interests_hint": "کوما سے الگ کریں",
            "complete_btn": "سیٹ اپ مکمل کریں"
        }
    },
    "sa": {
        "nav_continue": "अग्रसरताम्",
        "change": "परिवर्तयतु",
        "interests_placeholder": "यथा संगीतम्, पठनम्, योगः",
        "onboarding": {
            "title": "मनोसाथी स्वागतम्",
            "subtitle": "भवतां अनुभवं वैयक्तिकं कर्तुं वयं भवन्तः सम्यक् जानीमः।",
            "required_fields": "कृपया सर्वाणि आवश्यकानि क्षेत्राणि पूरयन्तु",
            "success": "मनोसाथी स्वागतम्!",
            "error": "किंचित् दोषः अभवत्। कृपया पुनः प्रयासं कुर्वन्तु।",
            "goals_label": "मनोसाथी प्रति भवतः किम् आनयत्?",
            "goals_placeholder": "अहं तनावं न्यूनीकर्तुं इच्छामि, निद्रां सुधारयितुं इच्छामि...",
            "interests_hint": "अल्पविरामेन पृथक् कुर्वन्तु",
            "complete_btn": "व्यवस्थापनं पूर्णं कुर्वन्तु"
        }
    }
}

for lang_code, data in updates.items():
    file_path = os.path.join(locales_dir, lang_code, "translation.json")
    
    if not os.path.exists(file_path):
        print(f"Skipping {lang_code}: File not found")
        continue
        
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = json.load(f)
            
        # Update Nav
        if "nav" in content:
            content["nav"]["continue"] = data["nav_continue"]
            
        # Update Profile
        if "profile" in content:
            content["profile"]["interests_placeholder"] = data["interests_placeholder"]
            
        # Add Onboarding
        content["onboarding"] = data["onboarding"]
        
        # Add Common
        content["common"] = {
            "change": data["change"]
        }
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(content, f, indent=4, ensure_ascii=False)
            
        print(f"Updated {lang_code}")
        
    except Exception as e:
        print(f"Error updating {lang_code}: {e}")

print("Done updating all languages.")
