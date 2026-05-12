import { Cormorant_Garamond, DM_Sans, Inter, PT_Serif } from "next/font/google";
import { MerrakiiLanding } from "@/components/home/MerrakiiLanding";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-mk-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-mk-serif",
  display: "swap",
  weight: ["400", "500", "600"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-mk-inter",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const ptSerif = PT_Serif({
  subsets: ["latin"],
  variable: "--font-mk-pt-serif",
  display: "swap",
  weight: ["400", "700"],
});

export const metadata = {
  title: "Merrakii — Study abroad & Study in India",
  description:
    "Merrakii by Munjal Universal Consultancy. International study destinations, counselling, and India pathways — fields, exams, institutes, and guided enrolment.",
};

export default function HomePage() {
  return (
    <div
      className={`${dmSans.variable} ${cormorant.variable} ${inter.variable} ${ptSerif.variable} min-h-screen w-full max-w-[100%] overflow-x-clip antialiased`}
    >
      <MerrakiiLanding />
    </div>
  );
}
