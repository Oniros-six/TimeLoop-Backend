export function calculateFee(totalIncome: number, lowIncome: number, highIncome: number, lowFee: number, highFee: number): number {
    if (totalIncome < lowIncome) {
        // No se aplica un porcentaje
        return 0;
    } else if (totalIncome <= highIncome) {
        return highFee;
    } else {
        return lowFee;
    }
}
