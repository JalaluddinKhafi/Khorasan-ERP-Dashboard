    
    if (num >= 1000000) {
        word += numberToWords(Math.floor(num / 1000000)) + " میلیون ";
        num %= 1000000;
    }
    if (num >= 1000) {
        word += numberToWords(Math.floor(num / 1000)) + " هزار ";
        num %= 1000;
    }
    if (num >= 100) {
        word += hundreds[Math.floor(num / 100)] + " ";
        num %= 100;
    }
    if (num >= 20) {
        word += tens[Math.floor(num / 10)] + " ";
        num %= 10;
    }
    if (num > 0 && num < 10) {
        word += units[num] + " ";
    }
    
    return word.trim();
}