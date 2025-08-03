import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { sefariaAPI } from "@/lib/sefaria";

// Seder organization with Hebrew names
const SEDER_ORGANIZATION = {
  "Seder Zeraim": {
    hebrew: "סדר זרעים",
    description: "Agriculture and blessings",
    tractates: ["Berakhot"]
  },
  "Seder Moed": {
    hebrew: "סדר מועד", 
    description: "Holidays and appointed times",
    tractates: ["Shabbat", "Eruvin", "Pesachim", "Rosh Hashanah", "Yoma", "Sukkah", "Beitza", "Ta'anit", "Megillah", "Mo'ed Katan", "Chagigah"]
  },
  "Seder Nashim": {
    hebrew: "סדר נשים",
    description: "Women and family law", 
    tractates: ["Yevamot", "Ketubot", "Nedarim", "Nazir", "Sotah", "Gittin", "Kiddushin"]
  },
  "Seder Nezikin": {
    hebrew: "סדר נזיקין",
    description: "Damages and civil law",
    tractates: ["Bava Kamma", "Bava Metzia", "Bava Batra", "Sanhedrin", "Makkot", "Shevu'ot", "Avodah Zarah", "Horayot"]
  },
  "Seder Kodashim": {
    hebrew: "סדר קדשים", 
    description: "Holy things and sacrifices",
    tractates: ["Zevahim", "Menachot", "Chullin", "Bekhorot", "Arachin", "Temurah", "Keritot", "Me'ilah", "Tamid", "Middot", "Kinnim"]
  },
  "Seder Tohorot": {
    hebrew: "סדר טהרות",
    description: "Ritual purity",
    tractates: ["Niddah"]
  }
};

// Tractate Hebrew names
const TRACTATE_HEBREW_NAMES: Record<string, string> = {
  "Berakhot": "ברכות",
  "Shabbat": "שבת", 
  "Eruvin": "עירובין",
  "Pesachim": "פסחים",
  "Rosh Hashanah": "ראש השנה", 
  "Yoma": "יומא",
  "Sukkah": "סוכה",
  "Beitza": "ביצה",
  "Ta'anit": "תענית",
  "Megillah": "מגילה", 
  "Mo'ed Katan": "מועד קטן",
  "Chagigah": "חגיגה",
  "Yevamot": "יבמות",
  "Ketubot": "כתובות",
  "Nedarim": "נדרים",
  "Nazir": "נזיר", 
  "Sotah": "סוטה",
  "Gittin": "גיטין",
  "Kiddushin": "קידושין",
  "Bava Kamma": "בבא קמא",
  "Bava Metzia": "בבא מציעא",
  "Bava Batra": "בבא בתרא",
  "Sanhedrin": "סנהדרין",
  "Makkot": "מכות",
  "Shevu'ot": "שבועות",
  "Avodah Zarah": "עבודה זרה", 
  "Horayot": "הוריות",
  "Zevahim": "זבחים",
  "Menachot": "מנחות",
  "Chullin": "חולין",
  "Bekhorot": "בכורות",
  "Arachin": "ערכין",
  "Temurah": "תמורה",
  "Keritot": "כריתות",
  "Me'ilah": "מעילה",
  "Tamid": "תמיד",
  "Middot": "מדות", 
  "Kinnim": "קינים",
  "Niddah": "נדה"
};

export default function Contents() {
  const { data: tractatesData, isLoading } = useQuery({
    queryKey: ['/api/tractates'],
    queryFn: () => sefariaAPI.getTractates("Talmud Bavli")
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  const availableTractates = tractatesData || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">Talmud Bavli</h1>
          <h2 className="text-2xl text-primary/80 mb-4">תלמוד בבלי</h2>
          <p className="text-lg text-muted-foreground">Table of Contents</p>
        </div>

        {/* Seder Sections */}
        <div className="space-y-8">
          {Object.entries(SEDER_ORGANIZATION).map(([sederName, sederData]) => {
            // Filter tractates that are available in our data
            const availableSederTractates = sederData.tractates.filter(
              tractate => availableTractates.includes(tractate)
            );

            if (availableSederTractates.length === 0) return null;

            return (
              <div key={sederName} className="space-y-4">
                {/* Seder Header */}
                <div className="text-center border-b border-border pb-4">
                  <h3 className="text-2xl font-semibold text-primary">
                    {sederName}
                  </h3>
                  <p className="text-lg text-primary/70 font-hebrew">
                    {sederData.hebrew}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {sederData.description}
                  </p>
                </div>

                {/* Tractates Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableSederTractates.map((tractate) => (
                    <Link 
                      key={tractate} 
                      href={`/contents/${tractate.toLowerCase()}`}
                    >
                      <Card className="h-full hover:shadow-md transition-shadow cursor-pointer border-border hover:border-primary/20">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">
                            <div className="text-primary">{tractate}</div>
                            <div className="text-sm text-primary/70 font-hebrew mt-1">
                              {TRACTATE_HEBREW_NAMES[tractate] || tractate}
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            Click to view chapters and pages
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}