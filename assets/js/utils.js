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