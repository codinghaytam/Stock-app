package com.olivepro.util;

public class NumberToWordsFr {

    private NumberToWordsFr() {}

    private static final String[] UNITS = {
        "", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf",
        "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize",
        "dix-sept", "dix-huit", "dix-neuf"
    };
    private static final String[] TENS = {
        "", "", "vingt", "trente", "quarante", "cinquante",
        "soixante", "soixante", "quatre-vingts", "quatre-vingt"
    };

    public static String convert(double amount) {
        long total = Math.round(amount * 100);
        long dirhams = total / 100;
        long centimes = total % 100;
        StringBuilder sb = new StringBuilder();
        sb.append(convertLong(dirhams));
        sb.append(dirhams > 1 ? " dirhams" : " dirham");
        if (centimes > 0) {
            sb.append(" et ").append(convertLong(centimes));
            sb.append(centimes > 1 ? " centimes" : " centime");
        }
        String result = sb.toString().trim();
        return Character.toUpperCase(result.charAt(0)) + result.substring(1);
    }

    private static String convertLong(long n) {
        if (n == 0) return "zéro";
        if (n < 0) return "moins " + convertLong(-n);
        StringBuilder sb = new StringBuilder();
        if (n >= 1_000_000) {
            long millions = n / 1_000_000;
            sb.append(millions == 1 ? "un million" : convertLong(millions) + " millions");
            n %= 1_000_000;
            if (n > 0) sb.append(" ");
        }
        if (n >= 1000) {
            long thousands = n / 1000;
            sb.append(thousands == 1 ? "mille" : convertLong(thousands) + " mille");
            n %= 1000;
            if (n > 0) sb.append(" ");
        }
        if (n >= 100) {
            long hundreds = n / 100;
            if (hundreds == 1) sb.append("cent");
            else sb.append(UNITS[(int) hundreds]).append(" cent");
            n %= 100;
            if (n > 0) sb.append(" ");
            else if (hundreds > 1) sb.append("s"); // cents prend un s si pas suivi
        }
        if (n > 0) sb.append(convertBelow100((int) n));
        return sb.toString().trim();
    }

    private static String convertBelow100(int n) {
        if (n < 20) return UNITS[n];
        int tensIdx = n / 10;
        int unit = n % 10;
        if (tensIdx == 7) { // 70-79 → soixante + 10-19
            return "soixante-" + UNITS[10 + unit];
        }
        if (tensIdx == 8) { // 80-89 → quatre-vingts
            return unit == 0 ? "quatre-vingts" : "quatre-vingt-" + UNITS[unit];
        }
        if (tensIdx == 9) { // 90-99 → quatre-vingt + 10-19
            return "quatre-vingt-" + UNITS[10 + unit];
        }
        String tens = TENS[tensIdx];
        if (unit == 0) return tens;
        if (unit == 1) return tens + "-et-un";
        return tens + "-" + UNITS[unit];
    }
}

