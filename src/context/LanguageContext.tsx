'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'ta';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, variables?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const dictionary: Record<Language, Record<string, string>> = {
  en: {
    // Navbar & Layout
    'nav.title': 'e-Petition Portal',
    'nav.subtitle': 'MLA Office Constituency Care',
    'nav.home': 'Home',
    'nav.submit': 'Submit Petition',
    'nav.track': 'Track Status',
    'nav.help': 'Help & Guidelines',
    'nav.dashboard': 'Dashboard',
    'nav.logout': 'Logout',
    'nav.login': 'Citizen Login',
    'nav.staff': 'Staff Portal',
    'nav.mla': 'MLA Portal',
    'nav.new_petition': 'New Petition',
    'nav.track_petition': 'Track Petition',
    'nav.help_center': 'Help Center',
    'nav.executive_dashboard': 'Executive Dashboard',
    'nav.manage_announcements': 'Manage Announcements',

    // Footer
    'footer.disclaimer': 'Official e-Petition and Constituency Grievance Redressal System of the MLA Office.',
    'footer.rights': 'All rights reserved.',
    'footer.sec1': 'Constituency Digital Care. Fast. Transparent. Secure.',
    'footer.privacy': 'Privacy Policy',
    'footer.terms': 'Terms & Conditions',

    // Citizen Home Welcome
    'home.hero_title': 'Direct Constituency Connection',
    'home.hero_subtitle': 'Submit your petitions, track live actions, and connect directly with the MLA Office.',
    'home.scan_qr_desc': 'Scan QR displayed at the MLA Office entrance to file on mobile.',
    'home.file_now': 'File a New Petition Now',
    'home.track_desc': 'Already filed? Check real-time progress using your petition code.',
    'home.track_btn': 'Track Your Petition',
    'home.quick_links': 'Constituency Quick Feeds',
    'home.recent_announcements': 'Recent MLA Announcements',
    'home.category_title': 'Core Support Portfolios',
    'home.lang_title': 'Select Language / மொழி',

    // Citizen Submit & Form
    'form.step1_title': 'Citizen Verification',
    'form.step1_desc': 'Verify your mobile number via OTP to start filing.',
    'form.step2_title': 'Profile Information',
    'form.step2_desc': 'Enter your contact details. This will be linked to your petition.',
    'form.step3_title': 'Grievance Particulars',
    'form.step3_desc': 'Provide the core details of the issue you are facing.',
    'form.step4_title': 'Attachments & GPS',
    'form.step4_desc': 'Upload photos/supporting documents and record GPS location.',
    'form.step5_title': 'Submission Review',
    'form.step5_desc': 'Double-check details before logging into the official register.',
    'form.name_label': 'Citizen Name',
    'form.name_placeholder': 'Enter your full name',
    'form.mobile_label': 'Mobile Number',
    'form.mobile_placeholder': '10-digit mobile number',
    'form.send_otp': 'Send Verification OTP',
    'form.otp_label': 'Enter 6-digit OTP Code',
    'form.verify_otp': 'Verify OTP',
    'form.otp_sent_alert': 'A simulated OTP code has been generated: {otp}',
    'form.otp_input_placeholder': 'Enter OTP received',
    'form.ward_label': 'Constituency Ward / Block',
    'form.address_label': 'Residential Address',
    'form.address_placeholder': 'Street, Building, Flat details',
    'form.category_label': 'Grievance Portfolio Category',
    'form.description_label': 'Detailed Grievance Description',
    'form.description_placeholder': 'Write details of the problem (minimum 10 characters)...',
    'form.upload_label': 'Supporting Photo / Document',
    'form.upload_desc': 'Drag & drop image or PDF, or click to browse. Max size 5MB.',
    'form.gps_label': 'GPS Location Tagging',
    'form.gps_fetch': 'Fetch Current GPS Location',
    'form.gps_fetched': 'GPS Coordinates Successfully Captured',
    'form.next': 'Continue',
    'form.prev': 'Back',
    'form.submit': 'Register Official Petition',
    'form.success_title': 'Petition Registered Successfully!',
    'form.success_desc': 'Your petition has been added to the database. An SMS confirmation has been logged.',
    'form.ref_code': 'Your Petition Tracking Code:',
    'form.copy_btn': 'Copy Code',
    'form.copied': 'Copied!',
    'form.track_flow_btn': 'Track Progress',
    'form.submit_another': 'Submit Another Grievance',
    'form.validation_error': 'Please check all required fields.',
    'form.description_min_len': 'Description must be at least 10 characters.',
    'form.empty_state_not_submitted': "You haven't submitted any petitions yet. Start by creating your first petition.",
    'form.start_first_petition': 'Create Your First Petition',

    // Categories
    'cat.roads': 'Roads & Infrastructure',
    'cat.water': 'Water Supply',
    'cat.pension': 'Pension',
    'cat.electricity': 'Electricity',
    'cat.schemes': 'Government Schemes',
    'cat.education': 'Education',
    'cat.others': 'Others',

    // Statuses
    'status.submitted': 'Submitted',
    'status.verified': 'Verified',
    'status.under_review': 'Under Review',
    'status.forwarded': 'Forwarded',
    'status.in_progress': 'In Progress',
    'status.resolved': 'Resolved',
    'status.closed': 'Closed',

    // Tracking Page
    'track.title': 'Constituency Track Panel',
    'track.desc': 'Enter your 12-character petition code (e.g., PT-2026-001247) to check progress.',
    'track.placeholder': 'Enter Petition Code (PT-2026-XXXXXX)',
    'track.search_btn': 'Search Database',
    'track.searching': 'Searching...',
    'track.not_found': 'No petition matches the entered tracking code.',
    'track.info_title': 'Grievance Record Details',
    'track.status_label': 'Current Action Status:',
    'track.timeline_title': 'Action Audit Trail',
    'track.remarks_label': 'Official Remarks:',
    'track.assigned_dept': 'Assigned Department:',
    'track.details_meta': 'Filed by {name} in {ward} on {date}',

    // Help Center
    'help.title': 'Help Center & Constituency Guidelines',
    'help.desc': 'Read guidelines on filing petitions, processing timelines, and check active public camps.',
    'help.tabs_title': 'Guidelines and FAQs',
    'help.faq1_q': 'What is the processing timeline for a petition?',
    'help.faq1_a': 'Typically, petitions are audited by staff within 24 hours. Emergency items (Electricity, Water) are resolved within 2-3 days, while infrastructure requests take up to 2 weeks.',
    'help.faq2_q': 'How do I attach photos or coordinate points?',
    'help.faq2_a': 'You can upload photos directly in Step 4 of the filing form. Use the GPS button to pin coordinates for precise street locations.',
    'help.faq3_q': 'Can I track my status offline?',
    'help.faq3_a': 'Yes, you can visit the MLA office token desk or call support using your tracking code (e.g. PT-2026-001247).',
    'help.announcements_board': 'Active Bulletins & Announcements',
    'help.no_announcements': 'No active public announcements at this time.',

    // Login Pages
    'login.mla_title': 'MLA Executive Console',
    'login.mla_subtitle': 'Secure portal access for the Honorable MLA / Super Admin',
    'login.staff_title': 'Staff Grievance Cell',
    'login.staff_subtitle': 'Secure portal access for constituency coordinators',
    'login.citizen_title': 'Citizen Verification',
    'login.citizen_subtitle': 'Verify your mobile number to view personal dashboard',
    'login.mobile_label': 'Registered Mobile Number',
    'login.password_label': 'Access Password',
    'login.login_btn': 'Access Console',
    'login.verifying': 'Verifying Credentials...',
    'login.error_fields': 'Please fill in all fields.',
    'login.error_failed': 'Verification failed. Please check credentials.',

    // Dashboards Common
    'dash.total_claims': 'Total Claims',
    'dash.pending_audit': 'Pending Audit',
    'dash.under_action': 'Under Action',
    'dash.resolved_cases': 'Resolved Cases',
    'dash.avg_resolution': 'Avg Resolution',
    'dash.satisfaction': 'Satisfaction',
    'dash.backlog_title': 'Grievance Backlog',
    'dash.no_petitions_title': 'No Petitions Yet',
    'dash.no_petitions_desc': 'No petitions have been submitted yet. They will appear here once citizens submit them.',
    'dash.search_filters': 'Filter backlog queue...',
    'dash.all_wards': 'All Wards',
    'dash.all_categories': 'All Categories',
    'dash.all_statuses': 'All Statuses',

    // Staff Dashboard actions
    'staff.action_title': 'Update Action Plan',
    'staff.select_status': 'Update Action Status',
    'staff.assign_dept': 'Forward Department',
    'staff.remarks_label': 'Official Action Remarks',
    'staff.remarks_placeholder': 'Write status details, actions taken or forwarding justifications...',
    'staff.update_btn': 'Commit Action Update',
    'staff.updating': 'Saving update...',
    'staff.success_alert': 'Action logged successfully!',
    'staff.select_petition': 'Select a petition from the backlog to view details and commit updates.',

    // MLA Dashboard
    'mla.nav_coordinators': 'Staff Coordinators',
    'mla.nav_dashboard': 'Grievance Dashboard',
    'mla.nav_announcements': 'Announcements Board',
    'mla.chart_trend': 'Petitions Trend (Last 7 Days)',
    'mla.chart_category': 'Petitions by Category',
    'mla.chart_ward': 'Petitions by Ward (Top 5)',
    'mla.chart_status': 'Petition Status Distribution',
    'mla.dept_perf': 'Department Wise Distribution',
    'mla.dept_name': 'Department',
    'mla.provision_title': 'Provision Staff Account',
    'mla.staff_name': 'Staff Full Name',
    'mla.staff_mobile': 'Mobile Number',
    'mla.staff_password': 'Secure Password',
    'mla.staff_ward': 'Assigned Ward Sector',
    'mla.staff_btn': 'Register Staff Coordinator',
    'mla.staff_list_title': 'Active Coordinators Directory',
    'mla.staff_no_users': 'No staff accounts provisioned yet.',

    // Setup page
    'setup.title': 'First-Time Setup Wizard',
    'setup.desc': 'Provision the MLA Super Admin / Super Administrator Account',
    'setup.name': 'Full Name',
    'setup.mobile': 'Registered Mobile',
    'setup.email': 'Email Address',
    'setup.password': 'Password',
    'setup.confirm': 'Confirm Password',
    'setup.submit': 'Initialize Super Admin'
  },
  ta: {
    // Navbar & Layout
    'nav.title': 'மின்னணு மனு போர்டல்',
    'nav.subtitle': 'சட்டமன்ற உறுப்பினர் அலுவலக தொகுதி சேவை',
    'nav.home': 'முகப்பு',
    'nav.submit': 'மனு தாக்கல்',
    'nav.track': 'நிலை அறிய',
    'nav.help': 'உதவி & வழிகாட்டுதல்',
    'nav.dashboard': 'முகப்பு பலகை',
    'nav.logout': 'வெளியேறுக',
    'nav.login': 'பொதுமக்கள் உள்நுழைவு',
    'nav.staff': 'அலுவலக பணியாளர்',
    'nav.mla': 'சட்டமன்ற உறுப்பினர்',
    'nav.new_petition': 'புதிய மனு',
    'nav.track_petition': 'மனு நிலை அறிய',
    'nav.help_center': 'உதவி மையம்',
    'nav.executive_dashboard': 'நிர்வாக பலகை',
    'nav.manage_announcements': 'அறிவிப்பு மேலாண்மை',

    // Footer
    'footer.disclaimer': 'சட்டமன்ற உறுப்பினர் அலுவலகத்தின் அதிகாரப்பூர்வ மின்னணு மனு மற்றும் தொகுதி குறைதீர்க்கும் அமைப்பு.',
    'footer.rights': 'அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.',
    'footer.sec1': 'தொகுதி டிஜிட்டல் சேவை. விரைவானது. வெளிப்படையானது. பாதுகாப்பானது.',
    'footer.privacy': 'தனியுரிமைக் கொள்கை',
    'footer.terms': 'விதிமுறைகள் & நிபந்தனைகள்',

    // Citizen Home Welcome
    'home.hero_title': 'நேரடி தொகுதி தொடர்பு',
    'home.hero_subtitle': 'உங்கள் மனுக்களைச் சமர்ப்பிக்கவும், நேரடி நடவடிக்கைகளைக் கண்காணிக்கவும் மற்றும் சட்டமன்ற உறுப்பினர் அலுவலகத்துடன் நேரடியாக இணைக்கவும்.',
    'home.scan_qr_desc': 'மொபைலில் தாக்கல் செய்ய சட்டமன்ற உறுப்பினர் அலுவலக நுழைவாயிலில் காட்டப்படும் QR குறியீட்டை ஸ்கேன் செய்யவும்.',
    'home.file_now': 'இப்போது புதிய மனுவை தாக்கல் செய்க',
    'home.track_desc': 'ஏற்கனவே தாக்கல் செய்துள்ளீர்களா? உங்கள் மனு குறியீட்டைப் பயன்படுத்தி நேரடி முன்னேற்றத்தைச் சரிபார்க்கவும்.',
    'home.track_btn': 'மனுவை கண்காணிக்கவும்',
    'home.quick_links': 'தொகுதி விரைவு அறிவிப்புகள்',
    'home.recent_announcements': 'சமீபத்திய அறிவிப்புகள்',
    'home.category_title': 'முக்கிய ஆதரவு துறைகள்',
    'home.lang_title': 'Select Language / மொழி',

    // Citizen Submit & Form
    'form.step1_title': 'பொதுமக்கள் சரிபார்ப்பு',
    'form.step1_desc': 'மனு தாக்கல் செய்ய உங்கள் மொபைல் எண்ணை OTP மூலம் சரிபார்க்கவும்.',
    'form.step2_title': 'சுயவிவரத் தகவல்',
    'form.step2_desc': 'தொடர்பு விவரங்களை உள்ளிடவும். இது உங்கள் மனுவுடன் இணைக்கப்படும்.',
    'form.step3_title': 'குறை விவரங்கள்',
    'form.step3_desc': 'பிரச்சனையின் முக்கிய விவரங்களை வழங்கவும்.',
    'form.step4_title': 'இணைப்புகள் & ஜிபிஎஸ் (GPS)',
    'form.step4_desc': 'புகைப்படங்கள்/ஆவணங்களை பதிவேற்றி ஜிபிஎஸ் (GPS) இருப்பிடத்தைப் பதிவு செய்யவும்.',
    'form.step5_title': 'விவரங்கள் சரிபார்ப்பு',
    'form.step5_desc': 'அதிகாரப்பூர்வ பதிவேட்டில் பதிவு செய்யுமுன் விவரங்களை இருமுறை சரிபார்க்கவும்.',
    'form.name_label': 'பொதுமக்கள் பெயர்',
    'form.name_placeholder': 'உங்கள் முழுப் பெயரை உள்ளிடவும்',
    'form.mobile_label': 'மொபைல் எண்',
    'form.mobile_placeholder': '10 இலக்க மொபைல் எண்',
    'form.send_otp': 'சரிபார்ப்பு OTP அனுப்புக',
    'form.otp_label': '6 இலக்க OTP குறியீட்டை உள்ளிடவும்',
    'form.verify_otp': 'OTP சரிபார்க்கவும்',
    'form.otp_sent_alert': 'ஒரு தற்காலிக OTP குறியீடு உருவாக்கப்பட்டுள்ளது: {otp}',
    'form.otp_input_placeholder': 'பெறப்பட்ட OTP ஐ உள்ளிடவும்',
    'form.ward_label': 'தொகுதி வார்டு / பகுதி',
    'form.address_label': 'வீட்டு முகவரி',
    'form.address_placeholder': 'தெரு, கட்டிடம், கதவு எண் விவரங்கள்',
    'form.category_label': 'குறைபாடு வகை / துறை',
    'form.description_label': 'விரிவான குறை விவரம்',
    'form.description_placeholder': 'பிரச்சனையின் விவரங்களை எழுதவும் (குறைந்தது 10 எழுத்துக்கள்)...',
    'form.upload_label': 'ஆதார புகைப்படம் / ஆவணம்',
    'form.upload_desc': 'புகைப்படம் அல்லது PDF-ஐ இழுத்து வந்து போடவும் அல்லது கோப்பைத் தேர்ந்தெடுக்கவும். அதிகபட்ச அளவு 5MB.',
    'form.gps_label': 'ஜிபிஎஸ் (GPS) இருப்பிடக் குறியீடு',
    'form.gps_fetch': 'தற்போதைய ஜிபிஎஸ் இருப்பிடத்தைப் பெறுக',
    'form.gps_fetched': 'ஜிபிஎஸ் ஒருங்கிணைப்புகள் வெற்றிகரமாகப் பெறப்பட்டன',
    'form.next': 'தொடரவும்',
    'form.prev': 'பின்னால்',
    'form.submit': 'அதிகாரப்பூர்வ மனுவை பதிவு செய்க',
    'form.success_title': 'மனு வெற்றிகரமாக பதிவு செய்யப்பட்டது!',
    'form.success_desc': 'உங்கள் மனு தரவுத்தளத்தில் சேர்க்கப்பட்டது. SMS உறுதிப்படுத்தல் அனுப்பப்பட்டுள்ளது.',
    'form.ref_code': 'உங்கள் மனு கண்காணிப்பு எண்:',
    'form.copy_btn': 'நகலெடு',
    'form.copied': 'நகலெடுக்கப்பட்டது!',
    'form.track_flow_btn': 'முன்னேற்றத்தைக் கண்காணிக்க',
    'form.submit_another': 'மற்றொரு மனுவை சமர்ப்பிக்க',
    'form.validation_error': 'தேவையான அனைத்து விவரங்களையும் நிரப்பவும்.',
    'form.description_min_len': 'விவரம் குறைந்தது 10 எழுத்துக்கள் இருக்க வேண்டும்.',
    'form.empty_state_not_submitted': 'நீங்கள் இன்னும் எந்த மனுவும் சமர்ப்பிக்கவில்லை. உங்கள் முதல் மனுவை உருவாக்கவும்.',
    'form.start_first_petition': 'முதல் மனுவை உருவாக்கவும்',

    // Categories
    'cat.roads': 'சாலைகள் & உள்கட்டமைப்பு',
    'cat.water': 'குடிநீர் விநியோகம்',
    'cat.pension': 'ஓய்வூதியம்',
    'cat.electricity': 'மின்சாரம்',
    'cat.schemes': 'அரசு திட்டங்கள்',
    'cat.education': 'கல்வி',
    'cat.others': 'இதர குறைகள்',

    // Statuses
    'status.submitted': 'சமர்ப்பிக்கப்பட்டது',
    'status.verified': 'சரிபார்க்கப்பட்டது',
    'status.under_review': 'ஆய்வில் உள்ளது',
    'status.forwarded': 'அனுப்பப்பட்டது',
    'status.in_progress': 'செயல்பாட்டில் உள்ளது',
    'status.resolved': 'தீர்வு காணப்பட்டது',
    'status.closed': 'நிறைவு செய்யப்பட்டது',

    // Tracking Page
    'track.title': 'தொகுதி மனு கண்காணிப்பு',
    'track.desc': 'முன்னேற்றத்தை அறிய உங்கள் 12 இலக்க மனு குறியீட்டை (எ.கா: PT-2026-001247) உள்ளிடவும்.',
    'track.placeholder': 'மனு குறியீட்டை உள்ளிடவும் (PT-2026-XXXXXX)',
    'track.search_btn': 'தேடுக',
    'track.searching': 'தேடப்படுகிறது...',
    'track.not_found': 'உள்ளிடப்பட்ட குறியீட்டுடன் எந்த மனுவும் பொருந்தவில்லை.',
    'track.info_title': 'மனு பதிவின் விவரங்கள்',
    'track.status_label': 'தற்போதைய நிலை:',
    'track.timeline_title': 'நடவடிக்கை வரலாறு',
    'track.remarks_label': 'அதிகாரப்பூர்வ குறிப்பு:',
    'track.assigned_dept': 'ஒதுக்கப்பட்ட துறை:',
    'track.details_meta': '{date} அன்று {ward}-ல் {name} என்பவரால் தாக்கல் செய்யப்பட்டது',

    // Help Center
    'help.title': 'உதவி மையம் & தொகுதி வழிகாட்டுதல்கள்',
    'help.desc': 'மனு தாக்கல் செய்தல், தீர்வு காலக்கெடு மற்றும் செயல்படும் பொது முகாம்கள் பற்றிய வழிகாட்டுதல்களைப் படியுங்கள்.',
    'help.tabs_title': 'வழிகாட்டுதல்கள் மற்றும் அடிக்கடி கேட்கப்படும் கேள்விகள்',
    'help.faq1_q': 'மனு தீர்வு செய்ய எவ்வளவு காலமாகும்?',
    'help.faq1_a': 'பொதுவாக, மனுக்கள் 24 மணி நேரத்திற்குள் பணியாளர்களால் ஆய்வு செய்யப்படும். அவசரத் தேவைகள் (மின்சாரம், குடிநீர்) 2-3 நாட்களில் தீர்க்கப்படும், உள்கட்டமைப்பு கோரிக்கைகளுக்கு 2 வாரங்கள் வரை ஆகும்.',
    'help.faq2_q': 'புகைப்படங்கள் அல்லது ஜிபிஎஸ் இருப்பிடத்தை எப்படி இணைப்பது?',
    'help.faq2_a': 'மனு படிவத்தின் 4-வது அடியில் புகைப்படங்களை நேரடியாக பதிவேற்றலாம். துல்லியமான தெரு இருப்பிடத்தைக் குறிக்க ஜிபிஎஸ் பொத்தானைப் பயன்படுத்தவும்.',
    'help.faq3_q': 'மனுவின் நிலையை இணையம் இல்லாமல் அறியலாமா?',
    'help.faq3_a': 'ஆம், உங்கள் மனு குறியீட்டுடன் (எ.கா: PT-2026-001247) சட்டமன்ற உறுப்பினர் அலுவலக உதவி மையத்தை நேரடியாக அணுகலாம்.',
    'help.announcements_board': 'செயலில் உள்ள பொது அறிவிப்புகள்',
    'help.no_announcements': 'தற்போது செயலில் உள்ள பொது அறிவிப்புகள் எதுவும் இல்லை.',

    // Login Pages
    'login.mla_title': 'MLA நிர்வாக கன்சோல்',
    'login.mla_subtitle': 'மதிப்பிற்குரிய சட்டமன்ற உறுப்பினர் / சூப்பர் அட்மினுக்கான பாதுகாப்பான உள்நுழைவு',
    'login.staff_title': 'பணியாளர் குறைதீர்க்கும் பிரிவு',
    'login.staff_subtitle': 'தொகுதி ஒருங்கிணைப்பாளர்களுக்கான பாதுகாப்பான உள்நுழைவு',
    'login.citizen_title': 'பொதுமக்கள் சரிபார்ப்பு',
    'login.citizen_subtitle': 'தனிப்பட்ட டாஷ்போர்டைப் பார்க்க மொபைல் எண்ணை சரிபார்க்கவும்',
    'login.mobile_label': 'பதிவுசெய்யப்பட்ட மொபைல் எண்',
    'login.password_label': 'ரகசிய குறியீட்டு கடவுச்சொல்',
    'login.login_btn': 'உள்நுழைக',
    'login.verifying': 'விவரங்கள் சரிபார்க்கப்படுகின்றன...',
    'login.error_fields': 'அனைத்து விவரங்களையும் நிரப்பவும்.',
    'login.error_failed': 'சரிபார்ப்பு தோல்வியுற்றது. விவரங்களைச் சரிபார்க்கவும்.',

    // Dashboards Common
    'dash.total_claims': 'மொத்த மனுக்கள்',
    'dash.pending_audit': 'ஆய்வில் உள்ளவை',
    'dash.under_action': 'நடவடிக்கையில் உள்ளவை',
    'dash.resolved_cases': 'தீர்க்கப்பட்டவை',
    'dash.avg_resolution': 'சராசரி தீர்வு காலம்',
    'dash.satisfaction': 'திருப்தி குறியீடு',
    'dash.backlog_title': 'மனுக்களின் பட்டியல்',
    'dash.no_petitions_title': 'மனுக்கள் எதுவும் இல்லை',
    'dash.no_petitions_desc': 'இதுவரை எந்த மனுக்களும் சமர்ப்பிக்கப்படவில்லை. பொதுமக்கள் சமர்ப்பித்தவுடன் அவை இங்கே தோன்றும்.',
    'dash.search_filters': 'தேடல் வடிகட்டி...',
    'dash.all_wards': 'அனைத்து வார்டுகள்',
    'dash.all_categories': 'அனைத்து பிரிவுகள்',
    'dash.all_statuses': 'அனைத்து நிலைகள்',

    // Staff Dashboard actions
    'staff.action_title': 'நடவடிக்கை நிலையை புதுப்பிக்க',
    'staff.select_status': 'நடவடிக்கை நிலையைத் தேர்ந்தெடுக்கவும்',
    'staff.assign_dept': 'துறைக்கு அனுப்பவும்',
    'staff.remarks_label': 'அதிகாரப்பூர்வ நடவடிக்கை குறிப்புகள்',
    'staff.remarks_placeholder': 'நடவடிக்கையின் விவரங்கள் அல்லது பரிந்துரைகளை எழுதவும்...',
    'staff.update_btn': 'நடவடிக்கையை பதிவு செய்க',
    'staff.updating': 'சேமிக்கப்படுகிறது...',
    'staff.success_alert': 'நடவடிக்கை வெற்றிகரமாக பதிவு செய்யப்பட்டது!',
    'staff.select_petition': 'மனுவின் விவரங்களைக் காண மற்றும் நடவடிக்கையை பதிவு செய்ய பட்டியலிலிருந்து ஒரு மனுவைத் தேர்ந்தெடுக்கவும்.',

    // MLA Dashboard
    'mla.nav_coordinators': 'அலுவலக பணியாளர்கள்',
    'mla.nav_dashboard': 'குறைதீர்ப்பு முகப்புப் பலகை',
    'mla.nav_announcements': 'அறிவிப்புப் பலகை',
    'mla.chart_trend': 'மனுக்களின் போக்கு (கடந்த 7 நாட்கள்)',
    'mla.chart_category': 'துறை வாரியாக மனுக்கள்',
    'mla.chart_ward': 'பகுதி வாரியாக மனுக்கள் (முதல் 5)',
    'mla.chart_status': 'மனு நிலைகளின் விநியோகம்',
    'mla.dept_perf': 'துறை வாரியான மனுக்களின் பகிர்வு',
    'mla.dept_name': 'துறை',
    'mla.provision_title': 'புதிய பணியாளர் கணக்கை உருவாக்க',
    'mla.staff_name': 'பணியாளரின் முழு பெயர்',
    'mla.staff_mobile': 'மொபைல் எண்',
    'mla.staff_password': 'கடவுச்சொல்',
    'mla.staff_ward': 'ஒதுக்கப்படும் வார்டு / பகுதி',
    'mla.staff_btn': 'பணியாளரை பதிவு செய்க',
    'mla.staff_list_title': 'செயலில் உள்ள பணியாளர்கள் பட்டியல்',
    'mla.staff_no_users': 'பணியாளர் கணக்குகள் எதுவும் இன்னும் உருவாக்கப்படவில்லை.',

    // Setup page
    'setup.title': 'முதல் முறை அமைவு வழிகாட்டி',
    'setup.desc': 'சட்டமன்ற உறுப்பினர் (Super Admin) கணக்கை உருவாக்கவும்',
    'setup.name': 'முழு பெயர்',
    'setup.mobile': 'பதிவுசெய்யப்பட்ட மொபைல்',
    'setup.email': 'மின்னஞ்சல் முகவரி',
    'setup.password': 'கடவுச்சொல்',
    'setup.confirm': 'கடவுச்சொல்லை உறுதிப்படுத்தவும்',
    'setup.submit': 'Super Admin கணக்கை உருவாக்கு'
  }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  // Detect and load language on mount
  useEffect(() => {
    const savedLang = localStorage.getItem('epetition_lang') as Language;
    if (savedLang === 'en' || savedLang === 'ta') {
      setLanguageState(savedLang);
    } else {
      // Auto-detect browser preferred language
      const browserLang = navigator.language.split('-')[0];
      if (browserLang === 'ta') {
        setLanguageState('ta');
        localStorage.setItem('epetition_lang', 'ta');
      } else {
        setLanguageState('en');
        localStorage.setItem('epetition_lang', 'en');
      }
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('epetition_lang', lang);
  };

  // Translation helper function
  const t = (key: string, variables?: Record<string, string | number>): string => {
    const translation = dictionary[language][key] || dictionary['en'][key] || key;
    
    if (!variables) return translation;
    
    // Replace placeholder variables (e.g. {otp})
    let formatted = translation;
    for (const [varKey, varValue] of Object.entries(variables)) {
      formatted = formatted.replace(new RegExp(`{${varKey}}`, 'g'), varValue.toString());
    }
    return formatted;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
