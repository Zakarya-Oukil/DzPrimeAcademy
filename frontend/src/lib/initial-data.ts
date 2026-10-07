import { Wilaya, Institution, Faculty, Specialty, AcademicYear, ModuleItem, ExamItem, User, AmbassadorProfile, Post, Locale } from '@/types';

export const WILAYAS: Wilaya[] = [
  { code: 1, nameAr: 'أدرار', nameFr: 'Adrar', nameEn: 'Adrar', region: 'SOUTH' },
  { code: 2, nameAr: 'الشلف', nameFr: 'Chlef', nameEn: 'Chlef', region: 'WEST' },
  { code: 3, nameAr: 'الأغواط', nameFr: 'Laghouat', nameEn: 'Laghouat', region: 'SOUTH' },
  { code: 4, nameAr: 'أم البواقي', nameFr: 'Oum El Bouaghi', nameEn: 'Oum El Bouaghi', region: 'EAST' },
  { code: 5, nameAr: 'باتنة', nameFr: 'Batna', nameEn: 'Batna', region: 'EAST' },
  { code: 6, nameAr: 'بجاية', nameFr: 'Béjaïa', nameEn: 'Bejaia', region: 'CENTER' },
  { code: 7, nameAr: 'بسكرة', nameFr: 'Biskra', nameEn: 'Biskra', region: 'SOUTH' },
  { code: 8, nameAr: 'بشار', nameFr: 'Béchar', nameEn: 'Bechar', region: 'WEST' },
  { code: 9, nameAr: 'البليدة', nameFr: 'Blida', nameEn: 'Blida', region: 'CENTER' },
  { code: 10, nameAr: 'البويرة', nameFr: 'Bouira', nameEn: 'Bouira', region: 'CENTER' },
  { code: 11, nameAr: 'تمنراست', nameFr: 'Tamanrasset', nameEn: 'Tamanrasset', region: 'SOUTH' },
  { code: 12, nameAr: 'تبسة', nameFr: 'Tébessa', nameEn: 'Tebessa', region: 'EAST' },
  { code: 13, nameAr: 'تلمسان', nameFr: 'Tlemcen', nameEn: 'Tlemcen', region: 'WEST' },
  { code: 14, nameAr: 'تيارت', nameFr: 'Tiaret', nameEn: 'Tiaret', region: 'WEST' },
  { code: 15, nameAr: 'تيزي وزو', nameFr: 'Tizi Ouzou', nameEn: 'Tizi Ouzou', region: 'CENTER' },
  { code: 16, nameAr: 'الجزائر العاصمة', nameFr: 'Alger', nameEn: 'Algiers', region: 'CENTER' },
  { code: 17, nameAr: 'الجلفة', nameFr: 'Djelfa', nameEn: 'Djelfa', region: 'CENTER' },
  { code: 18, nameAr: 'جيجل', nameFr: 'Jijel', nameEn: 'Jijel', region: 'EAST' },
  { code: 19, nameAr: 'سطيف', nameFr: 'Sétif', nameEn: 'Setif', region: 'EAST' },
  { code: 20, nameAr: 'سعيدة', nameFr: 'Saïda', nameEn: 'Saida', region: 'WEST' },
  { code: 21, nameAr: 'سكيكدة', nameFr: 'Skikda', nameEn: 'Skikda', region: 'EAST' },
  { code: 22, nameAr: 'سيدي بلعباس', nameFr: 'Sidi Bel Abbès', nameEn: 'Sidi Bel Abbes', region: 'WEST' },
  { code: 23, nameAr: 'عنابة', nameFr: 'Annaba', nameEn: 'Annaba', region: 'EAST' },
  { code: 24, nameAr: 'قالمة', nameFr: 'Guelma', nameEn: 'Guelma', region: 'EAST' },
  { code: 25, nameAr: 'قسنطينة', nameFr: 'Constantine', nameEn: 'Constantine', region: 'EAST' },
  { code: 26, nameAr: 'المدية', nameFr: 'Médéa', nameEn: 'Medea', region: 'CENTER' },
  { code: 27, nameAr: 'مستغانم', nameFr: 'Mostaganem', nameEn: 'Mostaganem', region: 'WEST' },
  { code: 28, nameAr: 'المسيلة', nameFr: "M'Sila", nameEn: "M'Sila", region: 'CENTER' },
  { code: 29, nameAr: 'معسكر', nameFr: 'Mascara', nameEn: 'Mascara', region: 'WEST' },
  { code: 30, nameAr: 'ورقلة', nameFr: 'Ouargla', nameEn: 'Ouargla', region: 'SOUTH' },
  { code: 31, nameAr: 'وهران', nameFr: 'Oran', nameEn: 'Oran', region: 'WEST' },
  { code: 32, nameAr: 'البيض', nameFr: 'El Bayadh', nameEn: 'El Bayadh', region: 'WEST' },
  { code: 33, nameAr: 'إليزي', nameFr: 'Illizi', nameEn: 'Illizi', region: 'SOUTH' },
  { code: 34, nameAr: 'برج بوعريريج', nameFr: 'Bordj Bou Arréridj', nameEn: 'Bordj Bou Arreridj', region: 'CENTER' },
  { code: 35, nameAr: 'بومرداس', nameFr: 'Boumerdès', nameEn: 'Boumerdes', region: 'CENTER' },
  { code: 36, nameAr: 'الطارف', nameFr: 'El Tarf', nameEn: 'El Tarf', region: 'EAST' },
  { code: 37, nameAr: 'تندوف', nameFr: 'Tindouf', nameEn: 'Tindouf', region: 'WEST' },
  { code: 38, nameAr: 'تيسمسيلت', nameFr: 'Tissemsilt', nameEn: 'Tissemsilt', region: 'CENTER' },
  { code: 39, nameAr: 'الوادي', nameFr: 'El Oued', nameEn: 'El Oued', region: 'EAST' },
  { code: 40, nameAr: 'خنشلة', nameFr: 'Khenchela', nameEn: 'Khenchela', region: 'EAST' },
  { code: 41, nameAr: 'سوق أهراس', nameFr: 'Souk Ahras', nameEn: 'Souk Ahras', region: 'EAST' },
  { code: 42, nameAr: 'تيبازة', nameFr: 'Tipaza', nameEn: 'Tipaza', region: 'CENTER' },
  { code: 43, nameAr: 'ميلة', nameFr: 'Mila', nameEn: 'Mila', region: 'EAST' },
  { code: 44, nameAr: 'عين الدفلى', nameFr: 'Aïn Defla', nameEn: 'Ain Defla', region: 'CENTER' },
  { code: 45, nameAr: 'النعامة', nameFr: 'Naâma', nameEn: 'Naama', region: 'WEST' },
  { code: 46, nameAr: 'عين تموشنت', nameFr: 'Aïn Témouchent', nameEn: 'Ain Temouchent', region: 'WEST' },
  { code: 47, nameAr: 'غرداية', nameFr: 'Ghardaïa', nameEn: 'Ghardaia', region: 'SOUTH' },
  { code: 48, nameAr: 'غليزان', nameFr: 'Relizane', nameEn: 'Relizane', region: 'WEST' },
  { code: 49, nameAr: 'تيميمون', nameFr: 'Timimoun', nameEn: 'Timimoun', region: 'SOUTH' },
  { code: 50, nameAr: 'برج باجي مختار', nameFr: 'Bordj Badji Mokhtar', nameEn: 'Bordj Badji Mokhtar', region: 'SOUTH' },
  { code: 51, nameAr: 'أولاد جلال', nameFr: 'Ouled Djellal', nameEn: 'Ouled Djellal', region: 'CENTER' },
  { code: 52, nameAr: 'بني عباس', nameFr: 'Béni Abbès', nameEn: 'Beni Abbes', region: 'SOUTH' },
  { code: 53, nameAr: 'عين صالح', nameFr: 'In Salah', nameEn: 'In Salah', region: 'SOUTH' },
  { code: 54, nameAr: 'عين قزام', nameFr: 'In Guezzam', nameEn: 'In Guezzam', region: 'SOUTH' },
  { code: 55, nameAr: 'تقرت', nameFr: 'Touggourt', nameEn: 'Touggourt', region: 'SOUTH' },
  { code: 56, nameAr: 'جانت', nameFr: 'Djanet', nameEn: 'Djanet', region: 'SOUTH' },
  { code: 57, nameAr: 'المغير', nameFr: "El M'Ghair", nameEn: "El M'Ghair", region: 'EAST' },
  { code: 58, nameAr: 'المنيعة', nameFr: 'El Meniaa', nameEn: 'El Meniaa', region: 'SOUTH' },
];

export const INSTITUTIONS: Institution[] = [
  // Universities
  {
    id: 'inst-usthb',
    nameAr: 'جامعة العلوم والتكنولوجيا هواري بومدين (USTHB - باب الزوار)',
    nameFr: 'Université des Sciences et de la Technologie Houari Boumediene (USTHB)',
    type: 'UNIVERSITY',
    wilayaCode: 16,
    logoUrl: '/logos/usthb.png',
  },
  {
    id: 'inst-alger1',
    nameAr: 'جامعة الجزائر 1 - بن يوسف بن خدة (كلية الطب والعلوم)',
    nameFr: "Université d'Alger 1 - Benyoucef Benkhedda (Médecine & Sciences)",
    type: 'UNIVERSITY',
    wilayaCode: 16,
    logoUrl: '/logos/alger1.png',
  },
  {
    id: 'inst-usto',
    nameAr: 'جامعة العلوم والتكنولوجيا وهران - محمد بوضياف (USTO-MB)',
    nameFr: 'Université des Sciences et de la Technologie d\'Oran - Mohamed Boudiaf (USTO)',
    type: 'UNIVERSITY',
    wilayaCode: 31,
    logoUrl: '/logos/usto.png',
  },
  {
    id: 'inst-mentouri',
    nameAr: 'جامعة الإخوة منتوري - قسنطينة 1 (Mentouri)',
    nameFr: 'Université Frères Mentouri - Constantine 1',
    type: 'UNIVERSITY',
    wilayaCode: 25,
    logoUrl: '/logos/mentouri.png',
  },
  {
    id: 'inst-setif1',
    nameAr: 'جامعة فرحات عباس - سطيف 1',
    nameFr: 'Université Ferhat Abbas - Sétif 1',
    type: 'UNIVERSITY',
    wilayaCode: 19,
    logoUrl: '/logos/setif1.png',
  },
  {
    id: 'inst-annaba',
    nameAr: 'جامعة باجي مختار - عنابة (UBMA)',
    nameFr: 'Université Badji Mokhtar - Annaba',
    type: 'UNIVERSITY',
    wilayaCode: 23,
    logoUrl: '/logos/annaba.png',
  },
  {
    id: 'inst-tlemcen',
    nameAr: 'جامعة أبو بكر بلقايد - تلمسان',
    nameFr: 'Université Abou Bekr Belkaïd - Tlemcen',
    type: 'UNIVERSITY',
    wilayaCode: 13,
    logoUrl: '/logos/tlemcen.png',
  },
  {
    id: 'inst-tizi',
    nameAr: 'جامعة مولود معمري - تيزي وزو (UMMTO)',
    nameFr: 'Université Mouloud Mammeri - Tizi Ouzou',
    type: 'UNIVERSITY',
    wilayaCode: 15,
    logoUrl: '/logos/ummto.png',
  },
  // High School General Track (BAC National)
  {
    id: 'inst-bac-national',
    nameAr: 'التعليم الثانوي الوطني - شهادة البكالوريا (BAC)',
    nameFr: 'Enseignement Secondaire National - Baccalauréat Algérien (BAC)',
    type: 'HIGH_SCHOOL',
    wilayaCode: 16,
  },
];

export const FACULTIES: Faculty[] = [
  // USTHB
  { id: 'fac-usthb-info', nameAr: 'كلية الإعلام الآلي', nameFr: "Faculté d'Informatique", institutionId: 'inst-usthb' },
  { id: 'fac-usthb-st', nameAr: 'كلية العلوم والتكنولوجيا والهندسة', nameFr: 'Faculté des Sciences et Technologies (ST)', institutionId: 'inst-usthb' },
  { id: 'fac-usthb-sm', nameAr: 'كلية علوم المادة (فيزياء وكيمياء)', nameFr: 'Faculté des Sciences de la Matière (SM)', institutionId: 'inst-usthb' },
  // Alger 1 (Medical)
  { id: 'fac-med-alger', nameAr: 'كلية الطب والصيدلة وطب الأسنان', nameFr: 'Faculté de Médecine et Pharmacie', institutionId: 'inst-alger1' },
  // USTO
  { id: 'fac-usto-info', nameAr: 'كلية الرياضيات والإعلام الآلي', nameFr: 'Faculté de Mathématiques et Informatique', institutionId: 'inst-usto' },
  // Mentouri Constantine
  { id: 'fac-mentouri-sciences', nameAr: 'كلية العلوم الدقيقة والإعلام الآلي', nameFr: 'Faculté des Sciences Exactes et Informatique', institutionId: 'inst-mentouri' },
  // BAC National
  { id: 'fac-bac-branches', nameAr: 'شعب البكالوريا الوطنية', nameFr: 'Filières Officielles du Baccalauréat', institutionId: 'inst-bac-national' },
];

export const SPECIALTIES: Specialty[] = [
  // University Info
  { id: 'spec-mi-tc', nameAr: 'جذع مشترك رياضيات وإعلام آلي (MI)', nameFr: 'Tronc Commun Mathématiques & Informatique (MI)', trackType: 'UNIVERSITY_LMD', facultyId: 'fac-usthb-info' },
  { id: 'spec-info-l2l3', nameAr: 'إعلام آلي عام (ISIL / SI)', nameFr: 'Licence Informatique Générale (ISIL / SI)', trackType: 'UNIVERSITY_LMD', facultyId: 'fac-usthb-info' },
  // University ST
  { id: 'spec-st-tc', nameAr: 'جذع مشترك علوم وتكنولوجيا (ST)', nameFr: 'Tronc Commun Sciences & Technologies (ST)', trackType: 'UNIVERSITY_LMD', facultyId: 'fac-usthb-st' },
  { id: 'spec-genie-civil', nameAr: 'هندسة مدنية وبناء', nameFr: 'Génie Civil & Construction', trackType: 'UNIVERSITY_LMD', facultyId: 'fac-usthb-st' },
  // Medical
  { id: 'spec-medecine', nameAr: 'دكتور في الطب البشري', nameFr: 'Doctorat en Médecine Générale', trackType: 'MEDICAL', facultyId: 'fac-med-alger' },
  { id: 'spec-pharmacie', nameAr: 'دكتور في الصيدلة', nameFr: 'Doctorat en Pharmacie', trackType: 'MEDICAL', facultyId: 'fac-med-alger' },
  // USTO Info
  { id: 'spec-usto-mi', nameAr: 'جذع مشترك MI - وهران', nameFr: 'Tronc Commun MI - USTO Oran', trackType: 'UNIVERSITY_LMD', facultyId: 'fac-usto-info' },
  // Constantine Info
  { id: 'spec-mentouri-mi', nameAr: 'جذع مشترك MI - قسنطينة', nameFr: 'Tronc Commun MI - Constantine', trackType: 'UNIVERSITY_LMD', facultyId: 'fac-mentouri-sciences' },
  // BAC Streams
  { id: 'spec-bac-scientifique', nameAr: 'شعبة علوم تجريبية (3AS)', nameFr: 'Sciences Expérimentales (3AS BAC)', trackType: 'BAC', facultyId: 'fac-bac-branches' },
  { id: 'spec-bac-math', nameAr: 'شعبة رياضيات (3AS Math)', nameFr: 'Mathématiques (3AS BAC)', trackType: 'BAC', facultyId: 'fac-bac-branches' },
  { id: 'spec-bac-technique', nameAr: 'شعبة تقني رياضي (هندسة)', nameFr: 'Technique Mathématique (3AS BAC)', trackType: 'BAC', facultyId: 'fac-bac-branches' },
  { id: 'spec-bac-gestion', nameAr: 'شعبة تسيير واقتصاد', nameFr: 'Gestion et Économie (3AS BAC)', trackType: 'BAC', facultyId: 'fac-bac-branches' },
];

export const ACADEMIC_YEARS: AcademicYear[] = [
  // MI TC (L1)
  { id: 'year-mi-s1', nameAr: 'السنة الأولى L1 - السداسي الأول (S1)', nameFr: 'Première Année L1 - Semestre 1 (S1)', semester: 'S1', specialtyId: 'spec-mi-tc' },
  { id: 'year-mi-s2', nameAr: 'السنة الأولى L1 - السداسي الثاني (S2)', nameFr: 'Première Année L1 - Semestre 2 (S2)', semester: 'S2', specialtyId: 'spec-mi-tc' },
  // Info L2
  { id: 'year-info-l2-s3', nameAr: 'السنة الثانية L2 - السداسي الثالث (S3)', nameFr: 'Deuxième Année L2 - Semestre 3 (S3)', semester: 'S3', specialtyId: 'spec-info-l2l3' },
  { id: 'year-info-l2-s4', nameAr: 'السنة الثانية L2 - السداسي الرابع (S4)', nameFr: 'Deuxième Année L2 - Semestre 4 (S4)', semester: 'S4', specialtyId: 'spec-info-l2l3' },
  // ST TC (L1)
  { id: 'year-st-s1', nameAr: 'السنة الأولى L1 ST - السداسي الأول (S1)', nameFr: 'Première Année ST - Semestre 1 (S1)', semester: 'S1', specialtyId: 'spec-st-tc' },
  // Medecine 1ere annee
  { id: 'year-med-1', nameAr: 'السنة الأولى طب بشري (1ère Année)', nameFr: '1ère Année Médecine (Cycle Préclinique)', semester: 'Annual', specialtyId: 'spec-medecine' },
  // BAC Scientifique
  { id: 'year-bac-sci-full', nameAr: 'السنة الثالثة ثانوي (3AS - البكالوريا)', nameFr: '3ème Année Secondaire - Session BAC', semester: 'Annual', specialtyId: 'spec-bac-scientifique' },
  // BAC Math
  { id: 'year-bac-math-full', nameAr: 'السنة الثالثة ثانوي رياضيات (3AS Math)', nameFr: '3ème Année Mathématiques - Session BAC', semester: 'Annual', specialtyId: 'spec-bac-math' },
];

export const MODULES: ModuleItem[] = [
  // L1 MI S1
  { id: 'mod-analyse1', nameAr: 'تحليل رياضي 1 (Analyse 1)', nameFr: 'Analyse Mathématique 1', code: 'MATH101', coefficient: 4, academicYearId: 'year-mi-s1', examsCount: 8 },
  { id: 'mod-algebre1', nameAr: 'جبر 1 (Algèbre 1)', nameFr: 'Algèbre Linéaire 1', code: 'MATH102', coefficient: 3, academicYearId: 'year-mi-s1', examsCount: 6 },
  { id: 'mod-algo1', nameAr: 'خوارزميات وهياكل بيانات 1 (ALSD 1)', nameFr: 'Algorithmique & Structures de Données 1', code: 'INFO101', coefficient: 4, academicYearId: 'year-mi-s1', examsCount: 9 },
  { id: 'mod-arch1', nameAr: 'بنية الآلة 1 (Structure Machine 1)', nameFr: 'Structure Machine 1 (Archi)', code: 'INFO102', coefficient: 3, academicYearId: 'year-mi-s1', examsCount: 5 },
  { id: 'mod-phys1', nameAr: 'فيزياء 1 - ميكانيك النقطة', nameFr: 'Physique 1 (Mécanique du Point)', code: 'PHYS101', coefficient: 2, academicYearId: 'year-mi-s1', examsCount: 4 },
  
  // L2 Info S3
  { id: 'mod-algo3', nameAr: 'خوارزميات متقدمة (ALSD 3)', nameFr: 'Algorithmique Avancée & Arbres', code: 'INFO201', coefficient: 4, academicYearId: 'year-info-l2-s3', examsCount: 7 },
  { id: 'mod-poo', nameAr: 'البرمجة كائنية التوجه (POO Java/C++)', nameFr: 'Programmation Orientée Objet (POO)', code: 'INFO202', coefficient: 3, academicYearId: 'year-info-l2-s3', examsCount: 6 },
  { id: 'mod-bd', nameAr: 'قواعد البيانات (BDD SQL)', nameFr: 'Bases de Données Relationnelles', code: 'INFO203', coefficient: 3, academicYearId: 'year-info-l2-s3', examsCount: 8 },
  { id: 'mod-si', nameAr: 'أنظمة المعلومات (Systèmes d\'Information)', nameFr: 'Systèmes d\'Information & Modélisation', code: 'INFO204', coefficient: 2, academicYearId: 'year-info-l2-s3', examsCount: 4 },

  // L1 ST S1
  { id: 'mod-st-math1', nameAr: 'رياضيات 1 (Mathématiques 1)', nameFr: 'Mathématiques Appliquées 1 (ST)', code: 'ST-M1', coefficient: 3, academicYearId: 'year-st-s1', examsCount: 5 },
  { id: 'mod-st-phys1', nameAr: 'فيزياء 1 (Physique 1)', nameFr: 'Physique 1 (Mécanique Générale)', code: 'ST-P1', coefficient: 3, academicYearId: 'year-st-s1', examsCount: 5 },
  { id: 'mod-st-chim1', nameAr: 'كيمياء 1 - بنية المادة', nameFr: 'Chimie 1 (Structure de la Matière)', code: 'ST-C1', coefficient: 3, academicYearId: 'year-st-s1', examsCount: 6 },

  // Medecine 1ere
  { id: 'mod-med-anat', nameAr: 'تشريح عام وتطبيقي (Anatomie)', nameFr: 'Anatomie Générale & Topographique', code: 'MED-ANAT', coefficient: 4, academicYearId: 'year-med-1', examsCount: 12 },
  { id: 'mod-med-histo', nameAr: 'علم الأنسجة والأجنة (Histologie)', nameFr: 'Histologie & Embryologie Médicale', code: 'MED-HIST', coefficient: 3, academicYearId: 'year-med-1', examsCount: 8 },
  { id: 'mod-med-physio', nameAr: 'علم وظائف الأعضاء (Physiologie)', nameFr: 'Physiologie Générale & Systémique', code: 'MED-PHYS', coefficient: 3, academicYearId: 'year-med-1', examsCount: 9 },

  // BAC Scientifique
  { id: 'mod-bac-math', nameAr: 'الرياضيات - بكالوريا علوم تجريبية', nameFr: 'Mathématiques BAC Sciences Exp.', code: 'BAC-MATH', coefficient: 5, academicYearId: 'year-bac-sci-full', examsCount: 15 },
  { id: 'mod-bac-sciences', nameAr: 'علوم الطبيعة والحياة - بكالوريا', nameFr: 'Sciences de la Nature & de la Vie', code: 'BAC-SNV', coefficient: 6, academicYearId: 'year-bac-sci-full', examsCount: 18 },
  { id: 'mod-bac-physique', nameAr: 'العلوم الفيزيائية - بكالوريا', nameFr: 'Physique-Chimie BAC', code: 'BAC-PHYS', coefficient: 5, academicYearId: 'year-bac-sci-full', examsCount: 16 },
  { id: 'mod-bac-arabe', nameAr: 'اللغة العربية وآدابها - بكالوريا', nameFr: 'Langue & Littérature Arabes BAC', code: 'BAC-AR', coefficient: 2, academicYearId: 'year-bac-sci-full', examsCount: 10 },
];

export const EXAMS: ExamItem[] = [
  // Analyse 1 Exams
  {
    id: 'exam-ana-2024-final',
    title: 'Examen Final Semestriel - Analyse 1 (Session Normale)',
    year: 2024,
    termType: 'FINAL_SEMESTRIAL',
    fileUrl: '/exams/usthb_analyse1_2024_final.pdf',
    solutionUrl: '/exams/usthb_analyse1_2024_final_corrige.pdf',
    isFreeSample: true,
    downloadsCount: 1420,
    moduleId: 'mod-analyse1',
    moduleName: 'Analyse 1',
    authorName: 'Dr. Brahimi & Équipe USTHB',
    trackType: 'UNIVERSITY_LMD',
    academicYearName: 'L1 MI - S1',
    institutionName: 'Université USTHB Bab Ezzouar',
    previewQuestionSnippet: 'Exercice 1 (5 pts): Soit f(x) = ln(1 + x) / x pour x > 0 et f(0) = 1. Étudier la continuité et dérivabilité de f en 0. Exercice 2 (7 pts): Théorème des Accroissements Finis et calcul des développements limités à l\'ordre 3 au voisinage de 0.',
    solutionSummary: 'Corrigé officiel validé avec barème détaillé: calcul des limites par DL, application stricte du TAF et preuve de la convergence uniforme.',
    createdAt: '2024-02-15',
  },
  {
    id: 'exam-ana-2024-emd1',
    title: 'EMD 1 / Interrogation Écrite - Suites et Fonctions',
    year: 2024,
    termType: 'MIDTERM_EMD',
    fileUrl: '/exams/usthb_analyse1_2024_emd1.pdf',
    solutionUrl: '/exams/usthb_analyse1_2024_emd1_corrige.pdf',
    isFreeSample: true,
    downloadsCount: 980,
    moduleId: 'mod-analyse1',
    moduleName: 'Analyse 1',
    authorName: 'Ambassadeur USTHB',
    trackType: 'UNIVERSITY_LMD',
    academicYearName: 'L1 MI - S1',
    institutionName: 'Université USTHB',
    previewQuestionSnippet: 'Exercice 1: Soit (Un) définie par U(n+1) = sqrt(2 + Un) avec U0 = 0. Montrer que (Un) est croissante et majorée par 2. En déduire sa limite.',
    solutionSummary: 'Démonstration par récurrence complète, calcul de limite l = 2 et étude de convergence rapide.',
    createdAt: '2023-11-20',
  },
  {
    id: 'exam-ana-2023-rat',
    title: 'Examen de Rattrapage - Analyse 1 (Session 2023)',
    year: 2023,
    termType: 'RATTRAPAGE',
    fileUrl: '/exams/usthb_analyse1_2023_rat.pdf',
    solutionUrl: '/exams/usthb_analyse1_2023_rat_corrige.pdf',
    isFreeSample: false, // Paid only
    downloadsCount: 620,
    moduleId: 'mod-analyse1',
    moduleName: 'Analyse 1',
    authorName: 'Dr. Brahimi',
    trackType: 'UNIVERSITY_LMD',
    academicYearName: 'L1 MI - S1',
    institutionName: 'Université USTHB Bab Ezzouar',
    previewQuestionSnippet: 'Exercice 1: Calcul des intégrales de Riemann et primitives usuelles. Exercice 2: Résolution de l\'équation différentielle y\' + 2xy = x.',
    solutionSummary: 'Méthode de variation de la constante explicitée et barème de rattrapage (20/20).',
    createdAt: '2023-06-18',
  },
  {
    id: 'exam-ana-2022-final',
    title: 'Sujet d\'Examen de Synthèse + Corrigé Barème Détaillé',
    year: 2022,
    termType: 'FINAL_SEMESTRIAL',
    fileUrl: '/exams/usthb_analyse1_2022_final.pdf',
    solutionUrl: '/exams/usthb_analyse1_2022_final_corrige.pdf',
    isFreeSample: false, // Paid only
    downloadsCount: 1150,
    moduleId: 'mod-analyse1',
    moduleName: 'Analyse 1',
    authorName: 'Équipe Pédagogique DZ Prime',
    trackType: 'UNIVERSITY_LMD',
    academicYearName: 'L1 MI - S1',
    institutionName: 'Université USTHB',
    previewQuestionSnippet: 'Problème de synthèse sur les formules de Taylor-Lagrange et étude asymptotique des suites récurrentes.',
    solutionSummary: 'Guide pas à pas avec astuces pour éviter les pièges classiques de concours et rattrapage.',
    createdAt: '2022-02-10',
  },

  // Algo 1 Exams
  {
    id: 'exam-algo-2024-final',
    title: 'Examen Final ALSD 1 (Pointeurs, Récursivité, Tableaux)',
    year: 2024,
    termType: 'FINAL_SEMESTRIAL',
    fileUrl: '/exams/usthb_algo1_2024_final.pdf',
    solutionUrl: '/exams/usthb_algo1_2024_final_corrige.pdf',
    isFreeSample: true,
    downloadsCount: 2310,
    moduleId: 'mod-algo1',
    moduleName: 'Algorithmique 1',
    authorName: 'Pr. Meziane',
    trackType: 'UNIVERSITY_LMD',
    academicYearName: 'L1 MI - S1',
    institutionName: 'USTHB Faculté d\'Informatique',
    previewQuestionSnippet: 'Exercice 1 (6 pts): Écrire une fonction récursive en C pour inverser une liste chaînée simple sans allocation mémoire supplémentaire. Exercice 2 (8 pts): Algorithme de tri fusion (Merge Sort) et calcul de complexité spatiale.',
    solutionSummary: 'Code source C commenté, diagramme de pointeurs avant/après et calcul O(N log N) avec arbre de récursion.',
    createdAt: '2024-02-18',
  },
  {
    id: 'exam-algo-2024-tp',
    title: 'Test Pratique Machine C/Pascal + Algorithmes Tri',
    year: 2024,
    termType: 'MIDTERM_EMD',
    fileUrl: '/exams/usthb_algo1_2024_tp.pdf',
    solutionUrl: '/exams/usthb_algo1_2024_tp_corrige.pdf',
    isFreeSample: true,
    downloadsCount: 1540,
    moduleId: 'mod-algo1',
    moduleName: 'Algorithmique 1',
    authorName: 'Ambassadeur Informatique',
    trackType: 'UNIVERSITY_LMD',
    academicYearName: 'L1 MI - S1',
    institutionName: 'USTHB Bab Ezzouar',
    previewQuestionSnippet: 'TP Noté: Manipulation de structures de données (Enregistrements étudiants avec moyennes pondérées et recherche dichotomique).',
    solutionSummary: 'Code prêt à compiler sous GCC avec jeux de tests complets.',
    createdAt: '2024-01-10',
  },
  {
    id: 'exam-algo-2023-full',
    title: 'Archive Complète 10 Ans d\'Examens Corrigés ALSD',
    year: 2023,
    termType: 'FINAL_SEMESTRIAL',
    fileUrl: '/exams/usthb_algo1_archive_gold.pdf',
    solutionUrl: '/exams/usthb_algo1_archive_gold_solutions.pdf',
    isFreeSample: false, // Paid only
    downloadsCount: 3890,
    moduleId: 'mod-algo1',
    moduleName: 'Algorithmique 1',
    authorName: 'Club Informatique DZ Prime',
    trackType: 'UNIVERSITY_LMD',
    academicYearName: 'L1 MI - S1',
    institutionName: 'Université USTHB',
    previewQuestionSnippet: 'Recueil des 25 sujets d\'examens officiels de 2014 à 2024 avec solutions certifiées.',
    solutionSummary: 'Toutes les solutions vérifiées par les enseignants avec barèmes officiels.',
    createdAt: '2023-09-01',
  },

  // Algèbre 1 Exams
  {
    id: 'exam-alg1-2024-final',
    title: 'Examen Final Algèbre 1 (Espaces Vectoriels & Matrices)',
    year: 2024,
    termType: 'FINAL_SEMESTRIAL',
    fileUrl: '/exams/usthb_algebre1_2024_final.pdf',
    solutionUrl: '/exams/usthb_algebre1_2024_final_corrige.pdf',
    isFreeSample: true,
    downloadsCount: 1280,
    moduleId: 'mod-algebre1',
    moduleName: 'Algèbre 1',
    authorName: 'Dr. Kadri & Équipe',
    trackType: 'UNIVERSITY_LMD',
    academicYearName: 'L1 MI - S1',
    institutionName: 'USTHB / Ferhat Abbas',
    previewQuestionSnippet: 'Exercice 1: Déterminer une base et la dimension de Ker(f) et Im(f) pour l\'endomorphisme f de R3. Exercice 2: Calcul de l\'inverse d\'une matrice 3x3 par la méthode de Gauss-Jordan.',
    solutionSummary: 'Démonstrations complètes des sous-espaces vectoriels et pivot de Gauss étape par étape.',
    createdAt: '2024-02-12',
  },

  // BAC Math Exams
  {
    id: 'exam-bac-math-2024',
    title: 'BAC Blanc National 2024 - Mathématiques (Sujet + Corrigé Barème)',
    year: 2024,
    termType: 'FINAL_SEMESTRIAL',
    fileUrl: '/exams/bac_math_2024_blanc.pdf',
    solutionUrl: '/exams/bac_math_2024_blanc_corrige.pdf',
    isFreeSample: true,
    downloadsCount: 5400,
    moduleId: 'mod-bac-math',
    moduleName: 'Mathématiques BAC',
    authorName: 'Collectif National des Enseignants',
    trackType: 'BAC',
    academicYearName: '3AS BAC Scientifique & Maths',
    institutionName: 'Éducation Nationale - Algérie',
    previewQuestionSnippet: 'التمرين الأول (04 نقاط): المتتاليات العددية والبرهان بالتراجع. التمرين الثاني (04 نقاط): الأعداد المركبة والتحويلات النقطية في المستوي. المسألة (08 نقاط): دراسة دالة أسية كاملة مع المناقشة البيانية f(x) = m.',
    solutionSummary: 'الحل النموذجي المعتمد مع سلم التنقيط الوزاري التفصيلي وشرح طريقة رسم المنحنى والمناقشة الدورانية والمايلة.',
    createdAt: '2024-05-15',
  },
  {
    id: 'exam-bac-math-2023-sujet1',
    title: 'BAC Officiel 2023 - Sujet 1 (Fonctions & Nombres Complexes)',
    year: 2023,
    termType: 'FINAL_SEMESTRIAL',
    fileUrl: '/exams/bac_math_2023_officiel.pdf',
    solutionUrl: '/exams/bac_math_2023_officiel_corrige.pdf',
    isFreeSample: true,
    downloadsCount: 8200,
    moduleId: 'mod-bac-math',
    moduleName: 'Mathématiques BAC',
    authorName: 'ONEC Algérie',
    trackType: 'BAC',
    academicYearName: '3AS BAC',
    institutionName: 'الديوان الوطني للامتحانات والمسابقات',
    previewQuestionSnippet: 'موضوع البكالوريا الرسمي 2023 - الموضوع الأول لشعبة العلوم التجريبية والرياضيات.',
    solutionSummary: 'تصحيح نموذجي معتمد من وزارة التربية الوطنية مع التوجيهات البيداغوجية لمصححي البكالوريا.',
    createdAt: '2023-06-25',
  },
  {
    id: 'exam-bac-math-gold-pack',
    title: 'Pack Gold Excellence: 50 Sujets Types BAC Résolus Pas à Pas',
    year: 2024,
    termType: 'FINAL_SEMESTRIAL',
    fileUrl: '/exams/bac_math_gold_pack_2024.pdf',
    solutionUrl: '/exams/bac_math_gold_pack_2024_corrige.pdf',
    isFreeSample: false, // Paid only
    downloadsCount: 4200,
    moduleId: 'mod-bac-math',
    moduleName: 'Mathématiques BAC',
    authorName: 'Élite DZ Prime',
    trackType: 'BAC',
    academicYearName: '3AS BAC',
    institutionName: 'أكاديمية ديزاد برايم الوطنية',
    previewQuestionSnippet: 'تجميعية 50 مسألة شاملة تغطي جميع أفكار الدوال اللوغاريتمية والأسية، القسمة في Z، والاحتمالات الشرطية.',
    solutionSummary: 'فيديوهات وشروحات مكتوبة مع حلول نموذجية مخصصة للراغبين في نيل معدل 18+ في البكالوريا.',
    createdAt: '2024-03-01',
  },

  // BAC Sciences Naturelles
  {
    id: 'exam-bac-snv-2024',
    title: 'BAC Blanc Sciences de la Nature & de la Vie 2024',
    year: 2024,
    termType: 'FINAL_SEMESTRIAL',
    fileUrl: '/exams/bac_snv_2024_blanc.pdf',
    solutionUrl: '/exams/bac_snv_2024_snv_corrige.pdf',
    isFreeSample: true,
    downloadsCount: 4950,
    moduleId: 'mod-bac-sciences',
    moduleName: 'Sciences Naturelles BAC',
    authorName: 'Pr. Karim Mansouri',
    trackType: 'BAC',
    academicYearName: '3AS Sciences Expérimentales',
    institutionName: 'ثانوية الرياضيات والامتياز',
    previewQuestionSnippet: 'التمرين الأول (05 نقاط): استرجاع منظم للمعلومات حول تركيب البروتين. التمرين الثاني (07 نقاط): الاستدلال العلمي حول تأثير السموم على المشابك العصبية. التمرين الثالث (08 نقاط): مسعى علمي كامل حول المناعة والبلعمة.',
    solutionSummary: 'منهجية الإجابة الجديدة (المسعى العلمي واسترجاع المعارف) مع شبكة تقييم معايير المعارف ومؤشرات الكفاءة.',
    createdAt: '2024-05-18',
  },

  // Anatomie Medecine
  {
    id: 'exam-med-anat-2024',
    title: 'QCM & Cas Cliniques d\'Anatomie - Membre Supérieur & Thorax',
    year: 2024,
    termType: 'MIDTERM_EMD',
    fileUrl: '/exams/alger1_anat_2024_emd1.pdf',
    solutionUrl: '/exams/alger1_anat_2024_emd1_corrige.pdf',
    isFreeSample: true,
    downloadsCount: 1890,
    moduleId: 'mod-med-anat',
    moduleName: 'Anatomie',
    authorName: 'Faculté de Médecine Ben Aknoun (Alger 1)',
    trackType: 'MEDICAL',
    academicYearName: '1ère Année Médecine',
    institutionName: 'Université d\'Alger 1 Benyoucef Benkhedda',
    previewQuestionSnippet: 'QCM 1-20: Rapports anatomiques du plexus brachial, vascularisation de la glande mammaire, et trajet du nerf médian au niveau du canal carpien.',
    solutionSummary: 'Justifications complètes de chaque item Vrai/Faux avec schémas de coupes anatomiques légendés.',
    createdAt: '2024-01-22',
  },
  {
    id: 'exam-med-anat-gold',
    title: 'Annales Officielles Corrigées de Médecine Alger 1 (2015-2024)',
    year: 2024,
    termType: 'FINAL_SEMESTRIAL',
    fileUrl: '/exams/alger1_med_annales_gold.pdf',
    solutionUrl: '/exams/alger1_med_annales_gold_corrige.pdf',
    isFreeSample: false, // Paid only
    downloadsCount: 3100,
    moduleId: 'mod-med-anat',
    moduleName: 'Anatomie',
    authorName: 'Club Santé & Médecine DZ Prime',
    trackType: 'MEDICAL',
    academicYearName: '1ère Année Médecine',
    institutionName: 'Faculté de Médecine Alger 1',
    previewQuestionSnippet: 'Archive complète des 10 dernières années d\'épreuves semestrielles d\'anatomie et histologie.',
    solutionSummary: 'Corrigés type validés par le collège des professeurs de médecine d\'Alger.',
    createdAt: '2024-02-01',
  },

  // USTO / ST Physique 1
  {
    id: 'exam-phys1-2024-usto',
    title: 'Examen Final Physique 1 (Mécanique du Point & Dynamique)',
    year: 2024,
    termType: 'FINAL_SEMESTRIAL',
    fileUrl: '/exams/usto_phys1_2024_final.pdf',
    solutionUrl: '/exams/usto_phys1_2024_final_corrige.pdf',
    isFreeSample: true,
    downloadsCount: 1650,
    moduleId: 'mod-phys1',
    moduleName: 'Physique 1',
    authorName: 'Dr. Youcef Bouzid (USTO)',
    trackType: 'UNIVERSITY_LMD',
    academicYearName: 'L1 ST / L1 MI - S1',
    institutionName: 'Université USTO-MB Oran',
    previewQuestionSnippet: 'Exercice 1 (Cinématique): Mouvement curviligne dans le repère de Frenet. Exercice 2 (Dynamique): Théorème de l\'énergie cinétique et oscillateur harmonique avec frottements visqueux.',
    solutionSummary: 'Équations différentielles du mouvement et calculs de travail/puissance résolus avec barème.',
    createdAt: '2024-02-14',
  },

  // L2 Info BDD
  {
    id: 'exam-bdd-2024-l2',
    title: 'Examen Final Bases de Données (Algèbre Relationnelle & SQL)',
    year: 2024,
    termType: 'FINAL_SEMESTRIAL',
    fileUrl: '/exams/usthb_bdd_2024_final.pdf',
    solutionUrl: '/exams/usthb_bdd_2024_final_corrige.pdf',
    isFreeSample: true,
    downloadsCount: 2150,
    moduleId: 'mod-bd',
    moduleName: 'Bases de Données (BDD)',
    authorName: 'Dr. Amina Benali',
    trackType: 'UNIVERSITY_LMD',
    academicYearName: 'L2 Informatique - S3',
    institutionName: 'USTHB Bab Ezzouar',
    previewQuestionSnippet: 'Exercice 1: Modèle Conceptuel de Données (MCD) vers Modèle Relationnel (MLDR). Exercice 2: Requêtes SQL avancées avec GROUP BY, HAVING, jointures externes et sous-requêtes imbriquées.',
    solutionSummary: 'Schéma relationnel 3FN (3ème Forme Normale) et scripts SQL testés sous PostgreSQL.',
    createdAt: '2024-02-10',
  },
];

// Demo/seed personas removed — the platform now uses real authentication only (see /api/auth/*).
export const DEMO_USERS: User[] = [];

export const AMBASSADORS: AmbassadorProfile[] = [];

// Helper functions for dynamic language selection
export function getLocalizedItemName(
  item: { nameAr: string; nameFr: string; nameEn?: string },
  locale: Locale
): string {
  if (locale === 'fr') return item.nameFr || item.nameAr;
  if (locale === 'en') return item.nameEn || item.nameFr || item.nameAr;
  return item.nameAr;
}

export function getLocalizedWilayaName(wilaya: Wilaya, locale: Locale): string {
  if (locale === 'fr') return wilaya.nameFr;
  if (locale === 'en') return wilaya.nameEn;
  return wilaya.nameAr;
}

export function getLocalizedAmbassadorBio(amb: AmbassadorProfile, locale: Locale): string {
  if (locale === 'fr') return amb.bioFr || amb.bioAr || '';
  if (locale === 'en') return amb.bioFr || amb.bioAr || '';
  return amb.bioAr || amb.bioFr || '';
}
