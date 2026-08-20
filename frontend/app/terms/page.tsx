"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Flame } from "lucide-react";
import RoleSelectionModal from "@/components/auth/RoleSelectionModal";
import type { Portal } from "@/types/portal";

const SECTIONS: { title: string; paragraphs: string[] }[] = [
  {
    title: "Definitions",
    paragraphs: [
      "In these Terms:",
      '"FlameIntel", "we", "us", or "our" means [Company legal name], the operator of the Service, with registered address at [Address], RC No. [RC number].',
      '"User", "you", or "your" means any person who accesses or uses the Service, including customers and vendors.',
      '"Customer" means a User who orders LPG through the Service.',
      '"Vendor" means an independent seller of LPG who is registered and verified to fulfil orders through the Service.',
      '"Order" means a request submitted by a Customer to purchase LPG and related delivery from a Vendor at the prices displayed at checkout.',
      '"Payment Journey" means the checkout and payment process supported on the Service (including card, bank transfer, USSD, or other methods we enable, and cash on delivery where offered).',
    ],
  },
  {
    title: "Nature of the Service",
    paragraphs: [
      "FlameIntel operates a technology platform that enables Customers to discover verified Vendors, place Orders for liquefied petroleum gas (LPG), complete payment through the Payment Journey, track delivery status, and, where available, view the approximate live location of the delivery person while an Order is out for delivery. The Service may also provide refill estimates and reminders based on information supplied by the Customer and the Customer's order history.",
      "Vendors are independent businesses. Except where we expressly state otherwise in writing, Vendors are not employees, agents, or partners of FlameIntel. FlameIntel does not itself supply LPG or operate delivery vehicles as a carrier, unless a specific Order is fulfilled under a separate written arrangement.",
      "We may modify, suspend, or discontinue any feature of the Service with reasonable notice where practicable. We do not warrant that the Service will be uninterrupted or error-free.",
    ],
  },
  {
    title: "Eligibility and Accounts",
    paragraphs: [
      "You must be at least eighteen (18) years of age and have legal capacity to enter into a binding contract under the laws of the Federal Republic of Nigeria.",
      "You must provide accurate registration information, including a valid mobile telephone number, and keep that information current.",
      "You are responsible for maintaining the confidentiality of your login credentials and for all activity under your account.",
      "Customer accounts are intended for ordering and tracking. Vendor accounts are intended for receiving and fulfilling Orders and require completion of verification steps we prescribe.",
      "You must not impersonate any person or entity or use another User's account without authority.",
      "We may suspend or terminate accounts that violate these Terms, present fraud or safety risk, or remain inactive for a prolonged period.",
    ],
  },
  {
    title: "Orders",
    paragraphs: [
      "An Order constitutes an offer by the Customer to purchase LPG and delivery from the selected Vendor at the prices and charges displayed before confirmation.",
      "Before confirmation, the Service shall display the gas price, the delivery charge (where applicable), and any other disclosed charges so that the total amount payable is clear.",
      "Vendors may accept or reject Orders. If an Order is rejected, we will notify the Customer. Any payment authorisation already obtained will be handled in accordance with our refund practices and the rules of the relevant payment provider.",
      "The Customer must provide a complete and accessible delivery address and must be available to receive the cylinder or to follow the delivery instructions stated in the Service.",
      "Title and risk in the goods pass in accordance with applicable law and upon successful delivery confirmation on the Service, subject to any proof-of-delivery requirements.",
    ],
  },
  {
    title: "Payment",
    paragraphs: [
      "Payment is completed through the Payment Journey using methods enabled on the Service. FlameIntel does not operate a stored wallet balance as a default payment product under these Terms. If a stored-balance product is introduced later, these Terms will be updated accordingly.",
      "By confirming an Order, you authorize the applicable payment provider to charge the selected payment method for the total amount shown at confirmation.",
      "If payment fails, you may be required to retry or select another method. Except for cash on delivery, an Order may not proceed until payment is confirmed.",
      "For cash on delivery, payment is collected upon delivery under the rules stated at checkout and any Vendor-specific conditions disclosed.",
      "Promotions, discounts, or similar incentives are subject to separate rules published by us and may be modified or withdrawn.",
      "Settlement to Vendors is governed by the commercial terms between FlameIntel and the Vendor and may occur on a different timetable from the Customer's payment.",
      "Payment processing fees charged by third-party providers may apply in accordance with the provider's rules and any disclosure made at checkout.",
    ],
  },
  {
    title: "Delivery and Location Tracking",
    paragraphs: [
      "Delivery is performed by the Vendor or a person engaged by the Vendor. Delivery times displayed on the Service are estimates only and are not guarantees. Traffic, weather, Vendor capacity, and access conditions may affect arrival.",
      "While an Order is marked out for delivery, the Service may display the approximate live location of the delivery person on a map. Location data depends on the delivery person's device, permissions, satellite signal, and network connectivity. Interruptions, delays, or inaccuracies may occur. The map is provided as a convenience and does not constitute a warranty of continuous or precise positioning.",
      "Users must not harass, threaten, or misuse location or contact information relating to delivery personnel.",
      "Proof of delivery (including photograph and/or confirmation code) may be required to close an Order.",
      "If the Customer is unavailable or the delivery location is inaccessible, the Vendor may follow the failed-delivery process, which may include re-attempt, return, or additional charges where those charges were disclosed or are otherwise permitted by law.",
    ],
  },
  {
    title: "Refill Estimates and Reminders",
    paragraphs: [
      "Any estimate of days remaining, suggested refill date, or similar figure is generated by software using information you provide and your order or refill history. It is not a measurement from a physical sensor attached to your cylinder.",
      "Estimates may be inaccurate. You remain responsible for monitoring your gas supply for safety and continuity of use.",
      "Reminders are optional. Where the Service allows, you may adjust or postpone them.",
      "We may use anonymised or aggregated data to improve the quality of estimates.",
    ],
  },
  {
    title: "Vendors",
    paragraphs: [
      "Vendors must provide accurate prices, service areas, and availability, and must supply lawful LPG products.",
      "Vendors are responsible for safe handling, transport, and compliance with applicable Nigerian regulations governing LPG.",
      "FlameIntel may verify Vendors, and may suspend or remove Vendors who breach these Terms, fail safety or quality standards, or are the subject of serious substantiated complaints.",
      "Commercial fees payable by Vendors (including any success-based commission on completed Orders) are set out in the Vendor agreement or onboarding terms and do not alter the Customer's obligation to pay the total shown at checkout.",
    ],
  },
  {
    title: "Cancellations, Refunds, and Disputes",
    paragraphs: [
      "A Customer may cancel an Order while it remains pending Vendor acceptance, subject to the controls shown in the Service. After acceptance, cancellation may be restricted.",
      "Refunds for cancelled, unfulfilled, or failed Orders are determined by the reason for failure, the rules of the payment method, and our support assessment. The time required to complete a refund depends on banks and payment providers.",
      "Complaints concerning quality, short measure, or delivery conduct should be reported promptly through Support with the Order reference and relevant details. FlameIntel may assist with records and mediation. We are not obliged to guarantee a particular commercial outcome beyond what applicable law requires and what we can reasonably verify.",
      "Claims that relate primarily to product quality or the conduct of a Vendor or delivery person may be directed to that Vendor. FlameIntel will, where reasonable, provide Order records to support resolution.",
    ],
  },
  {
    title: "Acceptable Use",
    paragraphs: [
      "You must not:",
      "Use the Service for unlawful purposes or to place fraudulent Orders.",
      "Attempt to gain unauthorized access to the Service, interfere with its operation, or extract data by automated means without our prior written consent.",
      "Submit false ratings, reviews, or information.",
      "Abuse, harass, or threaten FlameIntel staff, Vendors, delivery personnel, or other Users.",
      "Resell access to the Service or use it to build a competing product in a manner that violates applicable law or these Terms.",
    ],
  },
  {
    title: "Privacy and Location Data",
    paragraphs: [
      "We process personal data, including mobile number, delivery address, approximate location for delivery, and order history, in accordance with our Privacy Policy and applicable Nigerian data-protection law. Live delivery tracking involves processing location data of the delivery person and, where necessary, the delivery point. By using tracking features, you acknowledge that such processing is required for performance of the delivery-related aspects of the Service.",
    ],
  },
  {
    title: "Disclaimers",
    paragraphs: [
      'THE SERVICE IS PROVIDED ON AN "AS AVAILABLE" BASIS. TO THE FULLEST EXTENT PERMITTED BY THE LAWS OF THE FEDERAL REPUBLIC OF NIGERIA, FLAMEINTEL DISCLAIMS ALL WARRANTIES NOT EXPRESSLY SET OUT IN THESE TERMS, INCLUDING WARRANTIES OF UNINTERRUPTED ACCESS, ERROR-FREE MAPS, OR PERFECT REFILL ESTIMATES.',
      "LPG involves inherent safety risks. Users must follow safety guidance issued by regulators and Vendors. FlameIntel is not a safety device, gas detector, or emergency response service. In the event of a suspected leak or immediate danger, contact emergency services and the relevant gas emergency contacts without delay.",
    ],
  },
  {
    title: "Limitation of Liability",
    paragraphs: [
      "To the fullest extent permitted by law, FlameIntel shall not be liable for indirect, incidental, special, or consequential loss, including loss of business or loss arising from an unexpected shortage of gas.",
      "Subject to the preceding paragraph and to mandatory provisions of law that cannot be excluded, FlameIntel's aggregate liability arising out of or in connection with any Order or your use of the Service shall not exceed the greater of (a) the total amount you paid through the Service for the Order giving rise to the claim and (b) Fifty Thousand Naira (N50,000).",
      "Nothing in these Terms excludes or limits liability for death or personal injury caused by negligence where such exclusion is prohibited by law, or for fraud or fraudulent misrepresentation.",
      "Vendors remain responsible for their products and for the conduct of delivery. FlameIntel's role is that of a platform operator, except where liability cannot lawfully be limited.",
    ],
  },
  {
    title: "Indemnity",
    paragraphs: [
      "You agree to indemnify and hold harmless FlameIntel and its officers, directors, and employees from claims, losses, and expenses (including reasonable legal fees) arising from your misuse of the Service, provision of inaccurate addresses or information, or breach of these Terms, except to the extent caused by FlameIntel's willful misconduct or gross negligence.",
    ],
  },
  {
    title: "Intellectual Property",
    paragraphs: [
      "The Service, including its design, software, trademarks, and content provided by FlameIntel, is owned by or licensed to FlameIntel. You receive a limited, non-exclusive, non-transferable right to use the Service for its intended purpose. You may not copy, modify, or create derivative works from the Service except as permitted by law.",
    ],
  },
  {
    title: "Changes to these Terms",
    paragraphs: [
      'We may amend these Terms by publishing an updated version on the Service and revising the "Last updated" date. Where required by law, we will seek additional consent. Continued use of the Service after the effective date of changes constitutes acceptance of the revised Terms, except where mandatory law provides otherwise.',
    ],
  },
  {
    title: "Governing Law and Dispute Resolution",
    paragraphs: [
      "These Terms are governed by the laws of the Federal Republic of Nigeria. Subject to any mandatory consumer-protection rights, the courts of Lagos State shall have jurisdiction over disputes arising from these Terms or the Service.",
      "Parties are encouraged to attempt good-faith resolution through Support before commencing formal proceedings.",
    ],
  },
  {
    title: "General",
    paragraphs: [
      "If any provision of these Terms is held invalid or unenforceable, the remaining provisions shall continue in full force.",
      "Failure to enforce any provision shall not constitute a waiver of that provision.",
      "These Terms, together with the Privacy Policy and any Vendor agreement applicable to you, constitute the entire agreement between you and FlameIntel regarding the Service and supersede prior communications on the same subject.",
      "You may not assign your rights under these Terms without our prior written consent. We may assign our rights and obligations in connection with a corporate reorganization or transfer of the Service.",
    ],
  },
  {
    title: "Contact",
    paragraphs: [
      "Questions regarding these Terms may be directed to:",
      "Legal: [legal@flameintel.example]",
      "Support: channels listed under Contact Us / Support on the Service",
      "Postal: [Company legal name], [Registered address]",
    ],
  },
];

export default function TermsPage() {
  const router = useRouter();
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  const handleRoleContinue = (role: Portal) => {
    setIsRoleModalOpen(false);
    router.push(`/signup?role=${role}`);
  };

  return (
    <main className="min-h-screen bg-background">
      <header className="flex items-center justify-between bg-brand-900 px-6 py-4 md:px-12">
        <Link href="/" className="flex items-center gap-1.5 text-lg font-bold text-white">
          <Flame size={18} className="text-notify-400" fill="currentColor" />
          Flame<span className="text-notify-400">Intel</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm text-white/80">
          <Link href="/#about" className="hover:text-white">
            About
          </Link>
          <Link href="/#faq" className="hover:text-white">
            FAQ
          </Link>
          <Link href="/#contact" className="hover:text-white">
            Contact
          </Link>
        </nav>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-3xl font-bold text-ink-500">
          Terms and Conditions
        </h1>

        <div className="mt-6 rounded-lg border border-dashed border-brand-300 bg-brand-50/30 p-6">
          <p className="text-sm leading-relaxed text-ink-500">
            These Terms and Conditions ("Terms") govern access to
            and use of the FlameIntel website and related services (the
            "Service"). By creating an account, placing an
            order, or otherwise using the Service, you agree to be bound by
            these Terms. If you do not agree, you must not use the Service.
          </p>

          {SECTIONS.map((section) => (
            <div key={section.title} className="mt-6">
              <h2 className="text-sm font-bold uppercase tracking-wide text-ink-500">
                {section.title}
              </h2>
              {section.paragraphs.map((p, i) => (
                <p
                  key={i}
                  className="mt-2 text-sm leading-relaxed text-ink-500"
                >
                  {p}
                </p>
              ))}
            </div>
          ))}
        </div>

        <div className="mt-8 text-sm text-muted-500">
          <p className="font-semibold text-ink-500">FLAMEINTEL</p>
          <p>TERMS AND CONDITIONS</p>
          <p>Web Platform for LPG Ordering and Refill Planning</p>
          <p>Lagos, Nigeria</p>
          <p className="mt-1">Last updated: August 2026</p>
        </div>

        <button
          onClick={() => setIsRoleModalOpen(true)}
          className="mt-6 w-full rounded-lg bg-brand-500 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-hover"
        >
          Continue To SignUp
        </button>
      </div>

      <RoleSelectionModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        onContinue={handleRoleContinue}
      />
    </main>
  );
}