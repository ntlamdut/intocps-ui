export class Utilities{
        public static timeStringToNumberConversion(text: string, setterFunc: (val: number) => void): boolean {
        let value = Number(text);
        if (isNaN(value)) {
            return false;
        }
        else {
            setterFunc(value);
            return true;
        }
    }
}