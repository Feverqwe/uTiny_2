const toCp1251 = (sValue) => {
  var text = "", Ucode, ExitValue, s;
  for (var i = 0, sValue_len = sValue.length; i < sValue_len; i++) {
    s = sValue.charAt(i);
    Ucode = s.charCodeAt(0);
    var Acode = Ucode;
    if (Ucode > 1039 && Ucode < 1104) {
      Acode -= 848;
      ExitValue = "%" + Acode.toString(16);
    } else
    if (Ucode === 1025) {
      Acode = 168;
      ExitValue = "%" + Acode.toString(16);
    } else
    if (Ucode === 1105) {
      Acode = 184;
      ExitValue = "%" + Acode.toString(16);
    } else
    if (Ucode === 32) {
      Acode = 32;
      ExitValue = "%" + Acode.toString(16);
    } else
    if (Ucode === 10) {
      Acode = 10;
      ExitValue = "%0A";
    } else {
      ExitValue = s;
    }
    text = text + ExitValue;
  }
  return text;
};

export default toCp1251;