type LegalBlock =
  | { readonly type: "list"; readonly items: readonly string[] }
  | { readonly type: "paragraph"; readonly text: string };

type LegalSection = {
  readonly blocks: readonly LegalBlock[];
  readonly id?: string;
  readonly title: string;
};

type LegalDocumentProps = {
  readonly eyebrow: string;
  readonly id: string;
  readonly introduction: readonly string[];
  readonly sections: readonly LegalSection[];
  readonly title: string;
};

const paragraph = (text: string): LegalBlock => ({ type: "paragraph", text });
const list = (...items: readonly string[]): LegalBlock => ({ type: "list", items });

const privacySections: readonly LegalSection[] = [
  {
    title: "1. Information We Collect",
    blocks: [
      paragraph(
        "Account information may include your name, email address, account identifier, profile information you choose to provide, and authentication and session information.",
      ),
      paragraph(
        "Zius currently uses Better Auth as part of its authentication system. Authentication-related information may be processed to create sessions, verify your identity, protect your account, and provide access to the Service.",
      ),
      paragraph(
        "Zius does not currently offer Google Sign-In or Sign in with Apple. If third-party authentication methods are introduced, this Privacy Policy will be updated as appropriate before or when they become available.",
      ),
      paragraph(
        "When a user creates a participant or guest record, we may store a name, email address, and participant identifier. A guest may later be associated with a registered account where appropriate, such as when email addresses correspond.",
      ),
      paragraph("Bill and group information may include:"),
      list(
        "Bill names or descriptions",
        "Amounts and currency",
        "Participants and payer information",
        "Amounts owed and split methods",
        "Payment or settlement status",
        "Group information and relevant dates",
        "Other information you voluntarily associate with a bill or group",
      ),
      paragraph(
        "Zius may calculate how expenses are divided based on information supplied by users. Unless explicitly stated otherwise, Zius does not hold, transfer, receive, or process money between participants. Payment and settlement statuses are records used to track shared expenses.",
      ),
      paragraph(
        "Technical information processed while operating the Service may include IP address, device type, operating system, app version, browser type, request information, server logs, error or diagnostic information, and authentication or session information.",
      ),
    ],
  },
  {
    title: "2. How We Use Information",
    blocks: [
      paragraph("We may use information collected through Zius to:"),
      list(
        "Create, authenticate, and manage user accounts",
        "Create and manage bills, groups, participants, and guest records",
        "Calculate and display amounts owed and settlement history",
        "Associate participant records with registered users where appropriate",
        "Synchronize information across supported devices and services",
        "Operate, secure, maintain, troubleshoot, and improve the Service",
        "Prevent fraud, abuse, and unauthorized access",
        "Provide support and important Service-related communications",
        "Comply with applicable legal obligations",
      ),
      paragraph("We do not sell your personal information."),
    ],
  },
  {
    title: "3. Hosting and Infrastructure Providers",
    blocks: [
      paragraph(
        "Zius uses Vercel for portions of its hosting, deployment, server infrastructure, or web services. Technical information such as IP addresses, request details, timestamps, server logs, and related metadata may be processed through Vercel's infrastructure.",
      ),
      paragraph(
        "Zius uses Expo as part of the development, building, deployment, and operation of its mobile application. Depending on the Expo services used, technical information associated with builds, updates, devices, or app operation may be processed through Expo's infrastructure.",
      ),
      paragraph(
        "Zius uses Better Auth software for account authentication, sessions, and access control. The account information stored by Zius depends on the authentication features currently enabled.",
      ),
      paragraph(
        "These providers operate independently under their own privacy and security practices.",
      ),
    ],
  },
  {
    title: "4. Analytics",
    blocks: [
      paragraph(
        "Zius does not currently use PostHog or another product analytics platform to track user behavior within the application.",
      ),
      paragraph(
        "We may introduce analytics in the future to understand how Zius is used and improve the Service. If that happens, this policy will be updated to describe the actual provider, data, purposes, and choices before or when analytics are enabled. Where required by law, we will obtain any necessary consent.",
      ),
    ],
  },
  {
    title: "5. Social and Third-Party Sign-In",
    blocks: [
      paragraph(
        "Zius does not currently provide authentication through Google, Apple, or another social login provider.",
      ),
      paragraph(
        "If those options become available and you choose to use one, Zius may receive information you authorize the provider to share, such as your name, email address, provider-specific identifier, and profile information. Each provider independently processes information under its own privacy policy.",
      ),
    ],
  },
  {
    title: "6. How We Share Information",
    blocks: [
      paragraph(
        "We may disclose information to service providers only where reasonably necessary to operate, secure, maintain, or improve Zius. Provider categories may include hosting, cloud infrastructure, deployment, mobile infrastructure, authentication, databases, email, security, and error or performance monitoring.",
      ),
      paragraph("We may also disclose information where reasonably necessary to:"),
      list(
        "Comply with applicable law or a valid legal request",
        "Protect Zius, its users, or others",
        "Investigate fraud, abuse, or security issues",
        "Enforce our Terms and Conditions",
        "Complete a merger, acquisition, financing, sale, or restructuring involving Zius",
      ),
      paragraph("We do not sell personal information to advertisers or data brokers."),
    ],
  },
  {
    title: "7. Information About Other People",
    blocks: [
      paragraph(
        "Zius allows users to create participant records for friends, family members, colleagues, and other individuals. If you enter another person's information, you represent that you are authorized or otherwise permitted to provide it for managing shared expenses.",
      ),
      paragraph(
        "Provide only information reasonably necessary to identify participants, and do not use it for unrelated purposes.",
      ),
    ],
  },
  {
    title: "8. Data Retention",
    blocks: [
      paragraph(
        "We retain personal information only for as long as reasonably necessary to provide Zius, maintain accounts and shared-expense history, resolve disputes, prevent fraud or abuse, enforce our agreements, and meet legal obligations.",
      ),
      paragraph(
        "After account deletion, account-specific information may be deleted, anonymized, or otherwise removed where appropriate. Some information may temporarily remain in backups, security logs, or other systems for technical, security, fraud-prevention, or legal purposes.",
      ),
      paragraph(
        "Information associated with shared bills or groups may remain available where necessary to preserve other participants' accurate expense histories.",
      ),
    ],
  },
  {
    title: "9. Data Security",
    blocks: [
      paragraph(
        "We use reasonable administrative, technical, and organizational measures designed to protect personal information from unauthorized access, disclosure, loss, misuse, alteration, or destruction.",
      ),
      paragraph(
        "No internet service, server, database, or electronic storage system can be guaranteed completely secure. You are responsible for protecting your account credentials and should contact us if you believe your account has been compromised.",
      ),
    ],
  },
  {
    title: "10. Your Privacy Rights",
    blocks: [
      paragraph(
        "Zius is operated from the Philippines and handles personal information in accordance with applicable privacy requirements, including the Data Privacy Act of 2012 (Republic Act No. 10173) and its implementing rules and regulations where applicable.",
      ),
      paragraph("Depending on applicable law, you may have rights to:"),
      list(
        "Be informed about how your information is processed",
        "Access personal information held about you",
        "Correct inaccurate or incomplete information",
        "Object to certain processing",
        "Request erasure, blocking, or removal where applicable",
        "Withdraw consent where processing depends on consent",
        "Request data portability where applicable",
        "Claim damages or lodge a complaint with the appropriate authority",
      ),
      paragraph(
        "Some requests may be subject to exceptions permitted or required by law. Contact delosreyesjohnallen@gmail.com to exercise a privacy right.",
      ),
    ],
  },
  {
    id: "account-deletion",
    title: "11. Account Deletion",
    blocks: [
      paragraph(
        "You may request deletion of your Zius account through account-deletion functionality in the Service, where available, or by emailing delosreyesjohnallen@gmail.com.",
      ),
      paragraph(
        "Following deletion, we may delete or anonymize information associated with your account. Information relating to shared bills, groups, or expenses involving other users may remain where reasonably necessary to preserve those users' records.",
      ),
    ],
  },
  {
    title: "12. International Data Processing",
    blocks: [
      paragraph(
        "Some service providers may operate infrastructure outside the Philippines. Your information may therefore be stored or processed in other countries. Where required by law, we take reasonable steps to ensure personal information receives appropriate protection when processed internationally.",
      ),
    ],
  },
  {
    title: "13. Children's Privacy",
    blocks: [
      paragraph(
        "Zius is not intended for children who are not legally permitted to use online services or provide personal information without parental or guardian authorization.",
      ),
      paragraph(
        "We do not knowingly collect personal information directly from children where that authorization is legally required. If you believe a child provided information without appropriate authorization, email delosreyesjohnallen@gmail.com.",
      ),
    ],
  },
  {
    title: "14. Third-Party Services",
    blocks: [
      paragraph(
        "Third-party services used by or integrated with Zius operate independently and may have their own privacy policies, security practices, and terms. Zius is not responsible for their practices outside our reasonable control.",
      ),
    ],
  },
  {
    title: "15. Changes to This Privacy Policy",
    blocks: [
      paragraph(
        "We may update this Privacy Policy as Zius changes, including when we add authentication providers, analytics, PostHog, crash reporting, infrastructure providers, or new categories of personal information processing.",
      ),
      paragraph(
        "If we make material changes, we may provide notice through Zius, by email, on our website, or through another reasonable method. The effective date above indicates when the latest version became effective.",
      ),
    ],
  },
  {
    title: "16. Contact Us",
    blocks: [
      paragraph(
        "Zius is operated by John Allen Delos Reyes in the Philippines. For questions, concerns, or privacy requests, email delosreyesjohnallen@gmail.com or visit https://tryzius.com.",
      ),
    ],
  },
];

const termsSections: readonly LegalSection[] = [
  {
    title: "1. About Zius",
    blocks: [
      paragraph(
        "Zius is an expense-sharing and bill-management application that helps users organize shared expenses, create bills and groups, divide amounts between participants, and track amounts recorded as owed or paid.",
      ),
      paragraph(
        "Zius is primarily a record-keeping and calculation tool. Unless specifically stated otherwise, Zius is not a bank, financial institution, money-transfer service, payment processor, lender, escrow provider, or debt-collection service.",
      ),
      paragraph(
        "Amounts displayed as owed, paid, unpaid, or settled are user records and do not independently verify that money was transferred.",
      ),
    ],
  },
  {
    title: "2. Eligibility",
    blocks: [
      paragraph(
        "You must be legally capable of entering into these Terms under laws applicable to you. If you use Zius for a business or organization, you represent that you have authority to bind it to these Terms.",
      ),
    ],
  },
  {
    title: "3. User Accounts",
    blocks: [
      paragraph(
        "Some features require an account. You agree to provide accurate and current information, protect your credentials, prevent unauthorized use, and promptly notify us if you believe your account is compromised.",
      ),
      paragraph(
        "You are responsible for activity performed through your account unless applicable law provides otherwise.",
      ),
    ],
  },
  {
    title: "4. Participants and Guest Users",
    blocks: [
      paragraph(
        "Zius may let you add people who do not yet have accounts as participants in bills or groups. When adding another person's name, email address, or other information, you represent that you have an appropriate reason or authorization to provide it.",
      ),
      paragraph(
        "A participant record may later be connected with a registered user where appropriate. You must not use participant features to impersonate or harass someone, or to collect personal information for unrelated purposes.",
      ),
    ],
  },
  {
    title: "5. Bills and Expense Calculations",
    blocks: [
      paragraph(
        "Users may create bills with amounts, currency, payers, participants, split methods, groups, statuses, and dates. Zius may calculate obligations based on information and methods users select.",
      ),
      paragraph(
        "You are responsible for reviewing calculations before relying on them. Software errors, rounding, inaccurate user input, currency differences, or other circumstances can produce an incorrect amount.",
      ),
      paragraph(
        "Zius does not guarantee that a displayed amount represents a legally enforceable obligation.",
      ),
    ],
  },
  {
    title: "6. Settlements and Payments",
    blocks: [
      paragraph(
        "Users may mark obligations as paid, unpaid, active, or settled. These statuses are organizational records.",
      ),
      paragraph(
        "Unless Zius expressly introduces a payment-processing feature, marking an obligation paid or settled does not mean Zius processed or verified payment, guaranteed receipt of funds, or released anyone from a legal obligation.",
      ),
      paragraph(
        "Users are responsible for resolving disputes about actual payments among themselves.",
      ),
    ],
  },
  {
    title: "7. User Content",
    blocks: [
      paragraph(
        "You retain ownership of bill names, group names, participant information, notes, and other content you submit (User Content). You grant Zius a limited, worldwide, non-exclusive license to host, process, reproduce, and display User Content solely as reasonably necessary to operate and improve the Service.",
      ),
      paragraph(
        "You represent that you have the rights needed to submit User Content and that it does not violate applicable law or another person's rights.",
      ),
    ],
  },
  {
    title: "8. Acceptable Use",
    blocks: [
      paragraph("You agree not to use Zius to:"),
      list(
        "Violate applicable law or facilitate fraud or unlawful financial activity",
        "Impersonate, harass, threaten, or abuse another person",
        "Upload malicious software or harmful code",
        "Attempt unauthorized access to accounts, servers, or systems",
        "Interfere with the security or operation of Zius",
        "Scrape Service data without authorization",
        "Circumvent technical limitations or access restrictions",
        "Reverse engineer the Service except where law expressly permits it",
        "Use another person's personal information for unauthorized purposes",
      ),
      paragraph("We may restrict or suspend accounts that violate these Terms."),
    ],
  },
  {
    title: "9. Financial and Legal Responsibility",
    blocks: [
      paragraph(
        "Zius does not determine whether a debt legally exists, a participant must pay an amount, an expense is valid, a payment satisfies an obligation, or an arrangement complies with tax, accounting, employment, financial, or other legal requirements.",
      ),
      paragraph(
        "You are responsible for your financial decisions and agreements with other participants. Zius does not provide financial, accounting, tax, or legal advice.",
      ),
    ],
  },
  {
    title: "10. Disputes Between Users",
    blocks: [
      paragraph(
        "Agreements concerning shared expenses are between the relevant users or participants; Zius is not a party to them.",
      ),
      paragraph(
        "Users must resolve disagreements about bills, participants, payers, splits, payments, or settlements themselves. We may provide records stored within the Service but are not obligated to decide which party is correct.",
      ),
    ],
  },
  {
    title: "11. Intellectual Property",
    blocks: [
      paragraph(
        "Except for User Content, Zius and its software, designs, branding, graphics, interfaces, logos, and other materials are owned by or licensed to John Allen Delos Reyes and are protected by applicable intellectual-property laws.",
      ),
      paragraph(
        "These Terms do not transfer ownership to you. You receive a limited, revocable, non-exclusive, non-transferable right to use the Service for its intended purposes while these Terms remain in effect.",
      ),
    ],
  },
  {
    title: "12. Third-Party Services",
    blocks: [
      paragraph(
        "Zius may rely on third-party services for authentication, hosting, databases, email, error reporting, security, analytics, and other infrastructure. Your use of third-party functionality may be subject to that provider's terms and privacy policy.",
      ),
      paragraph("We are not responsible for third-party services outside our reasonable control."),
    ],
  },
  {
    title: "13. Availability and Changes",
    blocks: [
      paragraph(
        "We aim to provide a reliable Service but do not guarantee that Zius will always be available, error-free, secure, compatible with every device, or uninterrupted.",
      ),
      paragraph(
        "We may add, change, suspend, or discontinue features as the Service develops. Where reasonably practical, we will provide notice before changes that materially affect users.",
      ),
    ],
  },
  {
    title: "14. Account Suspension and Termination",
    blocks: [
      paragraph(
        "You may stop using Zius at any time. We may suspend or terminate access where reasonably necessary because you violated these Terms, your activity creates security or legal risks, your account is used fraudulently, law requires it, or continued access could harm Zius or others.",
      ),
      paragraph("Where appropriate, we may provide notice before termination."),
    ],
  },
  {
    title: "15. Disclaimer of Warranties",
    blocks: [
      paragraph(
        'To the maximum extent permitted by law, Zius is provided on an "as is" and "as available" basis.',
      ),
      paragraph(
        "We do not guarantee that calculations are error-free, user-supplied information is accurate, participants will repay amounts, data will never be lost, the Service will always be available, or Zius will satisfy every user's requirements.",
      ),
      paragraph(
        "Nothing in these Terms excludes warranties or protections that cannot legally be excluded.",
      ),
    ],
  },
  {
    title: "16. Limitation of Liability",
    blocks: [
      paragraph(
        "To the maximum extent permitted by law, John Allen Delos Reyes and Zius's contractors and affiliates will not be liable for indirect, incidental, special, consequential, exemplary, or punitive damages arising from your use of Zius.",
      ),
      paragraph(
        "This includes, where permitted, losses resulting from incorrect calculations, user disputes, unpaid obligations, data loss, unauthorized access, interruptions, or actions based on information displayed by Zius. Where liability cannot be excluded, it is limited to the maximum extent permitted by law.",
      ),
    ],
  },
  {
    title: "17. Indemnification",
    blocks: [
      paragraph(
        "To the extent permitted by law, you agree to indemnify and hold harmless John Allen Delos Reyes from claims, losses, damages, liabilities, and reasonable expenses resulting from your misuse of Zius, violation of these Terms, violation of another person's rights, or content you submit.",
      ),
      paragraph("This provision does not apply where prohibited by consumer-protection law."),
    ],
  },
  {
    title: "18. Privacy",
    blocks: [
      paragraph(
        "Our collection and use of personal information is described in the Zius Privacy Policy. By using the Service, you acknowledge that you have reviewed that policy.",
      ),
    ],
  },
  {
    title: "19. Changes to These Terms",
    blocks: [
      paragraph(
        "We may update these Terms to reflect changes to Zius, applicable law, or our practices. If changes are material, we may notify users through the Service, by email, or through another reasonable method.",
      ),
      paragraph(
        "Continued use after updated Terms become effective means you accept them to the extent permitted by law.",
      ),
    ],
  },
  {
    title: "20. Governing Law",
    blocks: [
      paragraph(
        "These Terms are governed by the laws of the Republic of the Philippines, without regard to conflict-of-law principles, except where mandatory consumer-protection laws provide otherwise.",
      ),
      paragraph(
        "Disputes relating to these Terms will be handled by courts or other dispute-resolution bodies with appropriate jurisdiction under applicable law.",
      ),
    ],
  },
  {
    title: "21. Severability and No Waiver",
    blocks: [
      paragraph(
        "If a provision of these Terms is found unenforceable, the remaining provisions will remain in effect to the fullest extent permitted by law. A failure to enforce a provision is not a waiver of the right to enforce it later.",
      ),
    ],
  },
  {
    title: "22. Entire Agreement",
    blocks: [
      paragraph(
        "These Terms and the Privacy Policy form the entire agreement between you and Zius concerning the Service and replace prior agreements about the same subject, except where another written agreement expressly applies.",
      ),
    ],
  },
  {
    title: "23. Contact",
    blocks: [
      paragraph(
        "Zius is operated by John Allen Delos Reyes in the Philippines. Questions about these Terms can be sent to delosreyesjohnallen@gmail.com. Website: https://tryzius.com.",
      ),
    ],
  },
];

function LegalDocument({ eyebrow, id, introduction, sections, title }: LegalDocumentProps) {
  const headingId = `${id}-heading`;

  return (
    <section
      aria-labelledby={headingId}
      className="scroll-mt-6 border-t border-[#e6e6e6] px-10 py-24 max-sm:px-2 max-sm:py-18"
      id={id}
    >
      <header className="mb-14 flex flex-col items-center gap-3 text-center">
        <span className="text-xs font-semibold tracking-[0.06em] text-black/60 uppercase">
          {eyebrow}
        </span>
        <h2
          className="m-0 text-[40px] leading-[1.05] font-bold tracking-[-0.05em] max-sm:text-[32px]"
          id={headingId}
        >
          {title}
        </h2>
        <p className="m-0 text-sm text-black/60">Effective September 5, 2026</p>
      </header>

      <article className="mx-auto max-w-190 rounded-[40px] bg-[#f2f2f7] px-10 py-12 max-sm:rounded-[28px] max-sm:px-6 max-sm:py-9">
        <div className="mb-10 space-y-4 text-[15px] leading-7 text-black/70">
          {introduction.map((text) => (
            <p className="m-0" key={text}>
              {text}
            </p>
          ))}
        </div>

        <div className="space-y-10">
          {sections.map((section) => (
            <section className="scroll-mt-6" id={section.id} key={section.title}>
              <h3 className="m-0 mb-4 text-xl font-bold tracking-[-0.025em]">{section.title}</h3>
              <div className="space-y-4 text-[15px] leading-7 text-black/70">
                {section.blocks.map((block, index) =>
                  block.type === "paragraph" ? (
                    <p className="m-0" key={`${block.text}-${index}`}>
                      {block.text}
                    </p>
                  ) : (
                    <ul className="m-0 space-y-2 pl-5" key={`${section.title}-list-${index}`}>
                      {block.items.map((item) => (
                        <li className="pl-1" key={item}>
                          {item}
                        </li>
                      ))}
                    </ul>
                  ),
                )}
              </div>
            </section>
          ))}
        </div>
      </article>
    </section>
  );
}

export function LegalDocuments() {
  return (
    <>
      <LegalDocument
        eyebrow="Your privacy"
        id="privacy"
        introduction={[
          "Zius respects your privacy and is committed to protecting the personal information you provide when using the Zius mobile application, website, and related services (the Service).",
          "Zius is operated by John Allen Delos Reyes in the Philippines. This Privacy Policy explains what information we collect, how we use it, when we may share it, and the rights available to you.",
        ]}
        sections={privacySections}
        title="Privacy Policy"
      />
      <LegalDocument
        eyebrow="Using Zius"
        id="tos"
        introduction={[
          "These Terms and Conditions govern your access to and use of the Zius mobile application, website, and related services (the Service).",
          "By creating an account, accessing, or using Zius, you agree to these Terms. If you do not agree, you must not use the Service.",
        ]}
        sections={termsSections}
        title="Terms and Conditions"
      />
    </>
  );
}
