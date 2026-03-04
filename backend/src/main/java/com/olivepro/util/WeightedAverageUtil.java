package com.olivepro.util;

public class WeightedAverageUtil {

    private WeightedAverageUtil() {}

    public static double recalc(double currentLevel, double currentValue,
                                double addedQty, double addedValue) {
        double newLevel = currentLevel + addedQty;
        if (newLevel <= 0) return 0;
        return (currentLevel * currentValue + addedQty * addedValue) / newLevel;
    }
}

