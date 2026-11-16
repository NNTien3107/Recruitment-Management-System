import { JobLevel, JobStatus, JobType, Prisma, PrismaClient, Role } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

const COMPANY_DATA = [
  {
    name: 'FPT Software',
    industry: 'Công nghệ thông tin',
    size: '1000+ nhân viên',
    address: 'Cầu Giấy, Hà Nội',
    website: 'https://fptsoftware.com',
  },
  {
    name: 'Viettel Digital',
    industry: 'Viễn thông & Fintech',
    size: '1000+ nhân viên',
    address: 'Nam Từ Liêm, Hà Nội',
    website: 'https://vietteldigital.com',
  },
  {
    name: 'VNG Corporation',
    industry: 'Internet & Game',
    size: '1000+ nhân viên',
    address: 'Quận 7, Hồ Chí Minh',
    website: 'https://vng.com.vn',
  },
  {
    name: 'MoMo (M_Service)',
    industry: 'Fintech',
    size: '500-1000 nhân viên',
    address: 'Quận 7, Hồ Chí Minh',
    website: 'https://momo.vn',
  },
  {
    name: 'Zalo Group',
    industry: 'Mạng xã hội & AI',
    size: '500-1000 nhân viên',
    address: 'Quận 7, Hồ Chí Minh',
    website: 'https://zalo.me',
  },
  {
    name: 'Shopee Vietnam',
    industry: 'Thương mại điện tử',
    size: '1000+ nhân viên',
    address: 'Ba Đình, Hà Nội',
    website: 'https://shopee.vn',
  },
  {
    name: 'Grab Vietnam',
    industry: 'Siêu ứng dụng',
    size: '500-1000 nhân viên',
    address: 'Quận 7, Hồ Chí Minh',
    website: 'https://grab.com',
  },
  {
    name: 'Tiki Corporation',
    industry: 'Thương mại điện tử',
    size: '500-1000 nhân viên',
    address: 'Tân Bình, Hồ Chí Minh',
    website: 'https://tiki.vn',
  },
  {
    name: 'VNPAY',
    industry: 'Fintech',
    size: '1000+ nhân viên',
    address: 'Đống Đa, Hà Nội',
    website: 'https://vnpay.vn',
  },
  {
    name: 'KMS Technology',
    industry: 'Gia công phần mềm',
    size: '1000+ nhân viên',
    address: 'Tân Bình, Hồ Chí Minh',
    website: 'https://kms-technology.com',
  },
  {
    name: 'NashTech Vietnam',
    industry: 'Tư vấn & Phần mềm',
    size: '1000+ nhân viên',
    address: 'Cầu Giấy, Hà Nội',
    website: 'https://nashtechglobal.com',
  },
  {
    name: 'Sun* Inc. (Sun Asterisk)',
    industry: 'Digital Studio',
    size: '1000+ nhân viên',
    address: 'Nam Từ Liêm, Hà Nội',
    website: 'https://sun-asterisk.vn',
  },
  {
    name: 'CMC Global',
    industry: 'Công nghệ thông tin',
    size: '1000+ nhân viên',
    address: 'Cầu Giấy, Hà Nội',
    website: 'https://cmcglobal.com.vn',
  },
  {
    name: 'RikkeiSoft',
    industry: 'Phần mềm & AI',
    size: '1000+ nhân viên',
    address: 'Nam Từ Liêm, Hà Nội',
    website: 'https://rikkeisoft.com',
  },
  {
    name: 'NAB Innovation Centre',
    industry: 'Ngân hàng & Tài chính',
    size: '500-1000 nhân viên',
    address: 'Quận 4, Hồ Chí Minh',
    website: 'https://nab.com.au',
  },
  {
    name: 'Bosch Global Software',
    industry: 'IoT & Automotive',
    size: '1000+ nhân viên',
    address: 'Tân Bình, Hồ Chí Minh',
    website: 'https://bosch.com.vn',
  },
  {
    name: 'One Mount Group',
    industry: 'Hệ sinh thái số',
    size: '500-1000 nhân viên',
    address: 'Gia Lâm, Hà Nội',
    website: 'https://onemount.com',
  },
  {
    name: 'KiotViet (Citigo)',
    industry: 'SaaS & RetailTech',
    size: '500-1000 nhân viên',
    address: 'Hai Bà Trưng, Hà Nội',
    website: 'https://kiotviet.vn',
  },
  {
    name: 'Base.vn',
    industry: 'B2B SaaS',
    size: '200-500 nhân viên',
    address: 'Cầu Giấy, Hà Nội',
    website: 'https://base.vn',
  },
  {
    name: 'Axon Active Vietnam',
    industry: 'Agile Software',
    size: '500-1000 nhân viên',
    address: 'Hải Châu, Đà Nẵng',
    website: 'https://axonactive.com',
  },
];

const JOB_ROLES = [
  {
    titlePrefix: 'Backend Engineer',
    skillsPool: [
      ['NodeJS', 'NestJS', 'TypeScript', 'PostgreSQL'],
      ['Java', 'Spring Boot', 'Microservices', 'Kafka'],
      ['Go', 'PostgreSQL', 'Redis', 'Docker'],
      ['Python', 'FastAPI', 'PostgreSQL', 'Redis'],
      ['C#', '.NET Core', 'SQL Server', 'Azure'],
    ],
  },
  {
    titlePrefix: 'Frontend Engineer',
    skillsPool: [
      ['React', 'TypeScript', 'TailwindCSS', 'NextJS'],
      ['VueJS', 'TypeScript', 'Pinia', 'Vite'],
      ['Angular', 'TypeScript', 'RxJS', 'SCSS'],
    ],
  },
  {
    titlePrefix: 'Fullstack Developer',
    skillsPool: [
      ['NodeJS', 'NestJS', 'React', 'TypeScript', 'PostgreSQL'],
      ['Java', 'Spring Boot', 'React', 'Docker'],
      ['Python', 'Django', 'VueJS', 'PostgreSQL'],
    ],
  },
  {
    titlePrefix: 'DevOps / Cloud Engineer',
    skillsPool: [
      ['Docker', 'Kubernetes', 'AWS', 'Terraform', 'CI/CD'],
      ['Linux', 'Ansible', 'Jenkins', 'GCP', 'Prometheus'],
    ],
  },
  {
    titlePrefix: 'Mobile Developer',
    skillsPool: [
      ['React Native', 'TypeScript', 'Redux'],
      ['Flutter', 'Dart', 'Firebase'],
      ['Swift', 'iOS', 'Objective-C'],
      ['Kotlin', 'Android', 'Jetpack Compose'],
    ],
  },
  {
    titlePrefix: 'Data & AI Engineer',
    skillsPool: [
      ['Python', 'PyTorch', 'TensorFlow', 'SQL'],
      ['Spark', 'Kafka', 'Airflow', 'Python', 'BigQuery'],
    ],
  },
  {
    titlePrefix: 'QA / Automation Tester',
    skillsPool: [
      ['Selenium', 'Playwright', 'TypeScript', 'Postman'],
      ['Cypress', 'JavaScript', 'API Testing', 'JMeter'],
    ],
  },
];

const LOCATIONS = ['Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng', 'Cần Thơ', 'Hải Phòng', 'Remote'];
const JOB_TYPES = [
  JobType.FULL_TIME,
  JobType.FULL_TIME,
  JobType.FULL_TIME,
  JobType.PART_TIME,
  JobType.INTERNSHIP,
  JobType.CONTRACT,
  JobType.REMOTE,
];
const LEVELS = [
  JobLevel.INTERN,
  JobLevel.FRESHER,
  JobLevel.JUNIOR,
  JobLevel.MIDDLE,
  JobLevel.SENIOR,
  JobLevel.LEAD,
  JobLevel.MANAGER,
];

function salaryRangeByLevel(level: JobLevel): { min: number | null; max: number | null } {
  switch (level) {
    case JobLevel.INTERN:
      return { min: 3000000, max: 6000000 };
    case JobLevel.FRESHER:
      return { min: 8000000, max: 14000000 };
    case JobLevel.JUNIOR:
      return { min: 12000000, max: 22000000 };
    case JobLevel.MIDDLE:
      return { min: 20000000, max: 35000000 };
    case JobLevel.SENIOR:
      return { min: 32000000, max: 60000000 };
    case JobLevel.LEAD:
      return { min: 50000000, max: 85000000 };
    case JobLevel.MANAGER:
      return { min: 65000000, max: 120000000 };
  }
}

async function main() {
  const totalJobsToSeed = 10000;
  console.log(`🚀 Bắt đầu seed dữ liệu mẫu (~${totalJobsToSeed} tin tuyển dụng)...`);

  const passwordHash = await argon2.hash('Password123!');

  // 1. Tạo tài khoản Admin và Candidate mẫu
  await prisma.user.upsert({
    where: { email: 'admin@rms.local' },
    update: {},
    create: {
      email: 'admin@rms.local',
      passwordHash,
      fullName: 'Quản trị viên Hệ thống',
      role: Role.ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { email: 'candidate@rms.local' },
    update: {},
    create: {
      email: 'candidate@rms.local',
      passwordHash,
      fullName: 'Nguyễn Văn Ứng Viên',
      role: Role.CANDIDATE,
    },
  });

  // 2. Tạo 20 Recruiter và 20 Company tương ứng (1-1)
  const companyIds: string[] = [];
  for (let i = 0; i < COMPANY_DATA.length; i++) {
    const c = COMPANY_DATA[i];
    const email = `recruiter${i + 1}@rms.local`;

    const recruiter = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash,
        fullName: `HR ${c.name}`,
        role: Role.RECRUITER,
      },
    });

    const company = await prisma.company.upsert({
      where: { ownerId: recruiter.id },
      update: {
        name: c.name,
        industry: c.industry,
        size: c.size,
        address: c.address,
        website: c.website,
      },
      create: {
        ownerId: recruiter.id,
        name: c.name,
        description: `${c.name} là doanh nghiệp hàng đầu trong lĩnh vực ${c.industry} tại Việt Nam.`,
        industry: c.industry,
        size: c.size,
        address: c.address,
        website: c.website,
      },
    });

    companyIds.push(company.id);
  }

  // 3. Xóa các tin cũ của các công ty seed (nếu chạy lại) để giữ đúng ~10.000 bản ghi
  await prisma.job.deleteMany({
    where: { companyId: { in: companyIds } },
  });

  // 4. Sinh 10.000 tin tuyển dụng theo lô (batch 2.000 tin/lần)
  const batchSize = 2000;
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;

  for (let offset = 0; offset < totalJobsToSeed; offset += batchSize) {
    const batch: Prisma.JobCreateManyInput[] = [];

    for (let j = 0; j < batchSize && offset + j < totalJobsToSeed; j++) {
      const idx = offset + j;
      const companyId = companyIds[idx % companyIds.length];
      const roleItem = JOB_ROLES[idx % JOB_ROLES.length];
      const skills =
        roleItem.skillsPool[Math.floor(idx / JOB_ROLES.length) % roleItem.skillsPool.length];
      const level = LEVELS[Math.floor(idx / 3) % LEVELS.length];
      const jobType = JOB_TYPES[Math.floor(idx / 5) % JOB_TYPES.length];
      const location = LOCATIONS[Math.floor(idx / 2) % LOCATIONS.length];
      const salary = salaryRangeByLevel(level);
      const isNegotiable = idx % 10 === 0; // 10% tin lương thỏa thuận

      // 85% APPROVED, 5% PENDING, 5% DRAFT, 5% CLOSED
      let status: JobStatus = JobStatus.APPROVED;
      if (idx % 20 === 1) status = JobStatus.PENDING;
      else if (idx % 20 === 2) status = JobStatus.DRAFT;
      else if (idx % 20 === 3) status = JobStatus.CLOSED;

      const createdAt = new Date(now - (idx % 60) * oneDayMs - (idx % 3600) * 1000);
      const deadline = new Date(now + ((idx % 45) + 7) * oneDayMs);

      batch.push({
        companyId,
        title: `[${level}] ${roleItem.titlePrefix} (${skills.slice(0, 2).join('/')}) #${idx + 1}`,
        description: `Tham gia phát triển hệ thống quy mô lớn sử dụng ${skills.join(', ')}. Làm việc tại ${location} theo mô hình Agile/Scrum.`,
        requirements: `Có kinh nghiệm làm việc với ${skills.join(', ')}. Tư duy giải quyết vấn đề tốt.`,
        benefits: 'Lương thưởng tháng 13, bảo hiểm sức khỏe cao cấp, xét tăng lương 2 lần/năm.',
        location,
        skills,
        salaryMin: isNegotiable ? null : salary.min,
        salaryMax: isNegotiable ? null : salary.max,
        jobType,
        level,
        status,
        approvedAt: status === JobStatus.APPROVED ? createdAt : null,
        closedAt: status === JobStatus.CLOSED ? new Date() : null,
        deadline,
        createdAt,
      });
    }

    await prisma.job.createMany({ data: batch });
    console.log(
      `✅ Đã chèn ${Math.min(offset + batchSize, totalJobsToSeed)}/${totalJobsToSeed} tin...`,
    );
  }

  // 5. Đo kiểm hiệu năng truy vấn tìm kiếm & lọc trên 10.000 bản ghi (mục tiêu < 500ms)
  const startTime = performance.now();
  const where: Prisma.JobWhereInput = {
    status: JobStatus.APPROVED,
    deletedAt: null,
    AND: [
      { OR: [{ deadline: null }, { deadline: { gte: new Date() } }] },
      {
        OR: [
          { title: { contains: 'Backend', mode: 'insensitive' } },
          { description: { contains: 'Backend', mode: 'insensitive' } },
        ],
      },
    ],
    skills: { hasSome: ['NodeJS', 'NestJS'] },
    location: { contains: 'Hà Nội', mode: 'insensitive' },
    jobType: JobType.FULL_TIME,
    salaryMax: { gte: 20000000 },
  };

  const [items, total] = await prisma.$transaction([
    prisma.job.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: 0,
      take: 20,
      include: {
        company: { select: { id: true, name: true, logoUrl: true, address: true } },
      },
    }),
    prisma.job.count({ where }),
  ]);
  const elapsedMs = (performance.now() - startTime).toFixed(2);

  console.log(
    `⚡ Benchmark Search (10.000 jobs): tìm thấy ${total} kết quả (trả về ${items.length} items) trong ${elapsedMs} ms (Yêu cầu < 500 ms)`,
  );
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi seed dữ liệu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
