/**
 * Convert .wav file to float32 array.
 *
 * @remarks
 * This method is part of the {@link core-library#Statistics | Statistics subsystem}.
 *
 * @param x - The first input number
 * @param y - The second input number
 * @returns The arithmetic mean of `x` and `y`
 *
 * @beta
 */

/**
 * @class
 * Merlin Audio package provides a variety of audio classification methods for bird songs.
 */
class MerlinAudio {
    /**
     * Convert .wav file to float32 array.
     *
     * @remarks
     * This method is part of the {@link core-library#Statistics | Statistics subsystem}.
     *
     * @param x - The first input number
     * @param y - The second input number
     * @returns float32 Array
     *
     * @beta
     */


    private readonly height: number;
    private readonly width: number;

    constructor(height: number, width: number) {
        this.height = height;
        this.width = width;
    }
    // Getter
    get area() {
        return this.calcArea();
    }
    // Method
    calcArea() {
        return this.height * this.width;
    }
}

const square = new Rectangle(10, 10);

console.log(square.area); // 100