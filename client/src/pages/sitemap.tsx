import { useSEO } from "@/hooks/use-seo";
import { TRACTATE_LISTS } from "@shared/tractates";
import { Link } from "wouter";

const SitemapPage = () => {
  useSEO({
    title: "Sitemap - All Pages & Tractates | ChavrutAI",
    description:
      "Complete sitemap of ChavrutAI's digital Talmud study platform. Find all tractates, famous pages, and study resources organized for easy navigation.",
    canonical: `${window.location.origin}/sitemap`,
    ogTitle: "ChavrutAI Sitemap - All Pages",
    ogDescription:
      "Complete sitemap of ChavrutAI's digital Talmud study platform. Find all tractates, famous pages, and study resources.",
    ogUrl: `${window.location.origin}/sitemap`,
    robots: "index, follow",
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-sepia-50 to-sepia-100 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-sepia-900 mb-4">
            ChavrutAI Sitemap
          </h1>
          <p className="text-lg text-sepia-700 max-w-3xl mx-auto">
            Navigate through all pages and tractates of our digital Talmud study
            platform. Organized for easy discovery and comprehensive study
            access.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Main Pages Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-sepia-900 mb-4 border-b-2 border-sepia-200 pb-2">
              Main Pages
            </h2>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-sepia-700 hover:text-sepia-900 hover:underline font-medium"
                >
                  Homepage - Study Talmud Online
                </Link>
              </li>
              <li>
                <Link
                  href="/contents"
                  className="text-sepia-700 hover:text-sepia-900 hover:underline font-medium"
                >
                  Complete Contents - All 37 Tractates
                </Link>
              </li>
              <li>
                <Link
                  href="/suggested-pages"
                  className="text-sepia-700 hover:text-sepia-900 hover:underline font-medium"
                >
                  Famous Talmud Pages - Essential Teachings
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-sepia-700 hover:text-sepia-900 hover:underline font-medium"
                >
                  About ChavrutAI - Platform Features
                </Link>
              </li>
            </ul>
          </div>

          {/* Order Zeraim */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-sepia-900 mb-4 border-b-2 border-sepia-200 pb-2">
              Seder Zeraim
              <span className="text-sm font-normal text-sepia-600 block">
                Seeds & Agriculture
              </span>
            </h2>
            <ul className="space-y-2">
              {TRACTATE_LISTS["Talmud Bavli"].slice(0, 1).map((tractate) => (
                <li key={tractate}>
                  <Link
                    href={`/contents/${tractate.toLowerCase().replace(/\s+/g, "-")}`}
                    className="text-sepia-700 hover:text-sepia-900 hover:underline"
                  >
                    {tractate} - Study Guide
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Order Moed */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-sepia-900 mb-4 border-b-2 border-sepia-200 pb-2">
              Seder Moed
              <span className="text-sm font-normal text-sepia-600 block">
                Festivals & Sabbath
              </span>
            </h2>
            <ul className="space-y-2">
              {TRACTATE_LISTS["Talmud Bavli"].slice(1, 13).map((tractate) => (
                <li key={tractate}>
                  <Link
                    href={`/contents/${tractate.toLowerCase().replace(/\s+/g, "-")}`}
                    className="text-sepia-700 hover:text-sepia-900 hover:underline"
                  >
                    {tractate} - Chapter Guide
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Order Nashim */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-sepia-900 mb-4 border-b-2 border-sepia-200 pb-2">
              Seder Nashim
              <span className="text-sm font-normal text-sepia-600 block">
                Women & Family Law
              </span>
            </h2>
            <ul className="space-y-2">
              {TRACTATE_LISTS["Talmud Bavli"].slice(13, 20).map((tractate) => (
                <li key={tractate}>
                  <Link
                    href={`/contents/${tractate.toLowerCase().replace(/\s+/g, "-")}`}
                    className="text-sepia-700 hover:text-sepia-900 hover:underline"
                  >
                    {tractate} - Study Materials
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Order Nezikin */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-sepia-900 mb-4 border-b-2 border-sepia-200 pb-2">
              Seder Nezikin
              <span className="text-sm font-normal text-sepia-600 block">
                Damages & Civil Law
              </span>
            </h2>
            <ul className="space-y-2">
              {TRACTATE_LISTS["Talmud Bavli"].slice(20, 30).map((tractate) => (
                <li key={tractate}>
                  <Link
                    href={`/contents/${tractate.toLowerCase().replace(/\s+/g, "-")}`}
                    className="text-sepia-700 hover:text-sepia-900 hover:underline"
                  >
                    {tractate} - Online Study
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Order Kodashim */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-sepia-900 mb-4 border-b-2 border-sepia-200 pb-2">
              Seder Kodashim
              <span className="text-sm font-normal text-sepia-600 block">
                Holy Things & Temple
              </span>
            </h2>
            <ul className="space-y-2">
              {TRACTATE_LISTS["Talmud Bavli"].slice(30, 41).map((tractate) => (
                <li key={tractate}>
                  <Link
                    href={`/contents/${tractate.toLowerCase().replace(/\s+/g, "-")}`}
                    className="text-sepia-700 hover:text-sepia-900 hover:underline"
                  >
                    {tractate} - Digital Access
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Order Taharot */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-sepia-900 mb-4 border-b-2 border-sepia-200 pb-2">
              Seder Taharot
              <span className="text-sm font-normal text-sepia-600 block">
                Ritual Purity
              </span>
            </h2>
            <ul className="space-y-2">
              {TRACTATE_LISTS["Talmud Bavli"].slice(35, 37).map((tractate) => (
                <li key={tractate}>
                  <Link
                    href={`/contents/${tractate.toLowerCase().replace(/\s+/g, "-")}`}
                    className="text-sepia-700 hover:text-sepia-900 hover:underline"
                  >
                    {tractate} - Hebrew English Text
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Featured Entry Points */}
          <div className="bg-sepia-50 rounded-lg border-2 border-sepia-200 p-6">
            <h2 className="text-2xl font-semibold text-sepia-900 mb-4 border-b-2 border-sepia-300 pb-2">
              Featured Study Paths
            </h2>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/tractate/berakhot/2a"
                  className="text-sepia-700 hover:text-sepia-900 hover:underline font-medium"
                >
                  Begin with Berakhot 2a - First Talmud Page
                </Link>
              </li>
              <li>
                <Link
                  href="/tractate/shabbat/31a"
                  className="text-sepia-700 hover:text-sepia-900 hover:underline font-medium"
                >
                  Famous Hillel Teaching - Shabbat 31a
                </Link>
              </li>
              <li>
                <Link
                  href="/tractate/sanhedrin/37a"
                  className="text-sepia-700 hover:text-sepia-900 hover:underline font-medium"
                >
                  Value of Human Life - Sanhedrin 37a
                </Link>
              </li>
              <li>
                <Link
                  href="/tractate/bava-metzia/59b"
                  className="text-sepia-700 hover:text-sepia-900 hover:underline font-medium"
                >
                  Oven of Akhnai - Bava Metzia 59b
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform Features */}
          <div className="bg-sepia-50 rounded-lg border-2 border-sepia-200 p-6">
            <h2 className="text-2xl font-semibold text-sepia-900 mb-4 border-b-2 border-sepia-300 pb-2">
              Platform Features
            </h2>
            <ul className="space-y-2 text-sm">
              <li className="text-sepia-700">
                📖 Bilingual Hebrew-English text display
              </li>
              <li className="text-sepia-700">
                🧭 Hierarchical breadcrumb navigation
              </li>
              <li className="text-sepia-700">
                🔍 Technical term highlighting system
              </li>
              <li className="text-sepia-700">
                🌙 Dark mode for comfortable study
              </li>
              <li className="text-sepia-700">📱 Mobile-responsive design</li>
              <li className="text-sepia-700">⚡ Fast modern web interface</li>
              <li className="text-sepia-700">🆓 Completely free access</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sepia-600">
          <p className="text-sm">
            ChavrutAI provides free access to the Babylonian Talmud with modern
            study tools. All text content sourced from Sefaria's open database.
          </p>
          <p className="text-xs mt-2">
            <Link href="/about" className="hover:underline">
              Learn more about our platform
            </Link>{" "}
            |
            <a href="/sitemap.xml" className="hover:underline ml-1">
              XML Sitemap
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SitemapPage;
