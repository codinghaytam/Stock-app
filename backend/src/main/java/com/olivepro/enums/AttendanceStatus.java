package com.olivepro.enums;
public enum AttendanceStatus {
    PRESENT, MATIN, APRES_MIDI, CONGE, ABSENT;
    public double coefficient() {
        return switch (this) {
            case PRESENT, CONGE -> 1.0;
            case MATIN, APRES_MIDI -> 0.5;
            case ABSENT -> 0.0;
        };
    }
}

