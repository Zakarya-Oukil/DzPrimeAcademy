export type Role =
  | 'OWNER'
  | 'ADMIN'
  | 'MODERATOR'
  | 'AMBASSADOR'
  | 'TEACHER'
  | 'STUDENT_FREE'
  | 'STUDENT_PAID';

export type Region = 'WEST' | 'EAST' | 'CENTER' | 'SOUTH';

export type InstitutionType = 'UNIVERSITY' | 'HIGH_SCHOOL';

export type TrackType = 'BAC' | 'UNIVERSITY_LMD' | 'MEDICAL';

export type ExamType = 'MIDTERM_EMD' | 'FINAL_SEMESTRIAL' | 'RATTRAPAGE';

export type PostType = 'EVENT' | 'STUDY_TIP' | 'SESSION_SCHEDULE' | 'ANNOUNCEMENT';

export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

export type Locale = 'ar' | 'fr' | 'en';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: Role;
  jobTitle?: string;
  adminRole?: string;
  bio?: string;
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  telegram?: string;
  youtube?: string;
  whatsapp?: string;
  website?: string;
  twitter?: string;
  github?: string;
  phone?: string;
  wilayaCode?: number;
  wilayaName?: string;
  institutionId?: string;
  institutionName?: string;
  track?: TrackType;
  specialty?: string;
  academicYear?: string;
  studentCardId?: string;
  isVerified?: boolean;
  mustChangePassword?: boolean;
  createdAt: string;
}

export interface Wilaya {
  code: number;
  nameAr: string;
  nameFr: string;
  nameEn: string;
  region: Region;
}

export interface Institution {
  id: string;
  nameAr: string;
  nameFr: string;
  type: InstitutionType;
  wilayaCode: number;
  logoUrl?: string;
  wilayaNameAr?: string;
}

export interface Faculty {
  id: string;
  nameAr: string;
  nameFr: string;
  institutionId: string;
}

export interface Specialty {
  id: string;
  nameAr: string;
  nameFr: string;
  trackType: TrackType;
  facultyId: string;
}

export interface AcademicYear {
  id: string;
  nameAr: string;
  nameFr: string;
  semester?: string;
  specialtyId: string;
}

export interface ModuleItem {
  id: string;
  nameAr: string;
  nameFr: string;
  code: string;
  coefficient: number;
  academicYearId: string;
  examsCount?: number;
}

export interface ExamItem {
  id: string;
  title: string;
  year: number;
  termType: ExamType;
  fileUrl: string;
  solutionUrl?: string | null;
  isFreeSample: boolean;
  /** Set by /api/exams: the server decides who may open the file. */
  isLocked?: boolean;
  downloadsCount: number;
  moduleId: string;
  moduleName?: string;
  authorName?: string;
  trackType?: TrackType;
  academicYearName?: string;
  institutionName?: string;
  previewQuestionSnippet?: string;
  solutionSummary?: string;
  createdAt: string;
}

export interface StudentReview {
  id: string;
  score: number; // 1-5
  comment: string;
  studentName: string;
  studentRole?: Role;
  institution?: string;
  createdAt: string;
}

export interface AmbassadorProfile {
  id: string;
  userId: string;
  user: User;
  wilayaCode: number;
  wilayaNameAr: string;
  wilayaNameFr?: string;
  region?: Region;
  institutionId: string;
  institutionNameAr: string;
  institutionNameFr?: string;
  specialtyName?: string;
  telegramHandle?: string;
  phone?: string;
  bioAr?: string;
  bioFr?: string;
  ratingAverage: number;
  ratingsCount: number;
  isVerified: boolean;
  upcomingSessionsCount: number;
  totalTipsShared: number;
  materialsCuratedCount?: number;
  studentsMentoredCount?: number;
  badges?: string[];
  reviews?: StudentReview[];
}

export interface Rating {
  id: string;
  score: number;
  comment?: string;
  ambassadorId: string;
  studentName: string;
  createdAt: string;
}

export interface PostComment {
  id: string;
  postId?: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorRole: Role;
  content: string;
  isVerifiedTeacher?: boolean;
  createdAt: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  type: PostType;
  wilayaCode?: number;
  wilayaName?: string;
  institutionId?: string;
  institutionName?: string;
  eventDate?: string;
  isOnline: boolean;
  meetUrl?: string;
  location?: string;
  isApproved: boolean;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorRole: Role;
  assignedTeacherId?: string;
  assignedTeacherName?: string;
  imageUrl?: string;
  videoUrl?: string;
  linkUrl?: string;
  isPrivate?: boolean;
  likesCount?: number;
  likedBy?: string[];
  comments?: PostComment[];
  createdAt: string;
}

// Bot Decision-Tree Types
export type BotStep =
  | 'TRACK'
  | 'WILAYA_OR_UNIV'
  | 'FACULTY_OR_STREAM'
  | 'SPECIALTY'
  | 'YEAR_SEMESTER'
  | 'MODULE'
  | 'EXAMS';

export interface BotSelectionState {
  track?: TrackType;
  wilayaCode?: number;
  wilayaName?: string;
  institutionId?: string;
  institutionName?: string;
  facultyId?: string;
  facultyName?: string;
  specialtyId?: string;
  specialtyName?: string;
  academicYearId?: string;
  academicYearName?: string;
  moduleId?: string;
  moduleName?: string;
}

// Digital Membership Card
export interface MembershipCardData {
  cardId: string;
  holderName: string;
  holderNameAr?: string;
  role: Role;
  roleTitleAr: string;
  roleTitleFr: string;
  roleTitleEn: string;
  jobTitle?: string;
  adminRole?: string;
  institutionName: string;
  wilayaCode: number;
  wilayaName: string;
  issueDate: string;
  expiryDate: string;
  isVerified: boolean;
  qrPayload: string;
  phone?: string;
  email?: string;
  bio?: string;
}

// Card Verification
export interface CardVerificationResult {
  isValid: boolean;
  card: MembershipCardData | null;
  message: string;
}
