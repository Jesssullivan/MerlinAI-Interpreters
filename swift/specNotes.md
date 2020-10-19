Here is some code I use to perform FFT in iOS using Accelerate Framework, which makes it quite fast.

    //keep all internal stuff inside this struct
        typedef struct FFTHelperRef {
            FFTSetup fftSetup; // Accelerate opaque type that contains setup information for a given FFT transform.
            COMPLEX_SPLIT complexA; // Accelerate type for complex number
            Float32 *outFFTData; // Your fft output data
            Float32 *invertedCheckData; // This thing is to verify correctness of output. Compare it with input.
        } FFTHelperRef;


//first - initialize your FFTHelperRef with this function.

    FFTHelperRef * FFTHelperCreate(long numberOfSamples) {
    
        FFTHelperRef *helperRef = (FFTHelperRef*) malloc(sizeof(FFTHelperRef));
        vDSP_Length log2n = log2f(numberOfSamples);    
        helperRef->fftSetup = vDSP_create_fftsetup(log2n, FFT_RADIX2);
        int nOver2 = numberOfSamples/2;
        helperRef->complexA.realp = (Float32*) malloc(nOver2*sizeof(Float32) );
        helperRef->complexA.imagp = (Float32*) malloc(nOver2*sizeof(Float32) );
        
        helperRef->outFFTData = (Float32 *) malloc(nOver2*sizeof(Float32) );
        memset(helperRef->outFFTData, 0, nOver2*sizeof(Float32) );
    
        helperRef->invertedCheckData = (Float32*) malloc(numberOfSamples*sizeof(Float32) );
        
        return  helperRef;
    }

//pass initialized FFTHelperRef, data and data size here. Return FFT data with numSamples/2 size.

    Float32 * computeFFT(FFTHelperRef *fftHelperRef, Float32 *timeDomainData, long numSamples) {
    	vDSP_Length log2n = log2f(numSamples);
        Float32 mFFTNormFactor = 1.0/(2*numSamples);
        
        //Convert float array of reals samples to COMPLEX_SPLIT array A
    	vDSP_ctoz((COMPLEX*)timeDomainData, 2, &(fftHelperRef->complexA), 1, numSamples/2);
        
        //Perform FFT using fftSetup and A
        //Results are returned in A
    	vDSP_fft_zrip(fftHelperRef->fftSetup, &(fftHelperRef->complexA), 1, log2n, FFT_FORWARD);
        
        //scale fft 
        vDSP_vsmul(fftHelperRef->complexA.realp, 1, &mFFTNormFactor, fftHelperRef->complexA.realp, 1, numSamples/2);
        vDSP_vsmul(fftHelperRef->complexA.imagp, 1, &mFFTNormFactor, fftHelperRef->complexA.imagp, 1, numSamples/2);
        
        vDSP_zvmags(&(fftHelperRef->complexA), 1, fftHelperRef->outFFTData, 1, numSamples/2);
        
        //to check everything =============================
        vDSP_fft_zrip(fftHelperRef->fftSetup, &(fftHelperRef->complexA), 1, log2n, FFT_INVERSE);
        vDSP_ztoc( &(fftHelperRef->complexA), 1, (COMPLEX *) fftHelperRef->invertedCheckData , 2, numSamples/2);
        //=================================================    
    
        return fftHelperRef->outFFTData;
    }



Use it like this:

1. Initialize it: **FFTHelperCreate(TimeDomainDataLenght);**

2. Pass Float32 time domain data, get frequency domain data on return: **Float32 *fftData = computeFFT(fftHelper, buffer, frameSize);**

Now you have an array where indexes=frequencies, values=magnitude (squared magnitudes?).
According to [Nyquist theorem][1] your maximum possible frequency in that array is half of your sample rate. That is if your sample rate = 44100, maximum frequency you can encode is 22050 Hz. 

So go find that Nyquist max frequency for your sample rate: **const Float32 NyquistMaxFreq = SAMPLE_RATE/2.0;**

Finding Hz is easy: **Float32 hz = ((Float32)someIndex / (Float32)fftDataSize) * NyquistMaxFreq;**
(fftDataSize = frameSize/2.0)

This works for me. If I generate specific frequency in Audacity and play it - this code detects the right one (the strongest one, you also need to find max in fftData to do this).

(there's still a little mismatch in about 1-2%. not sure why this happens. If someone can explain me why - that would be much appreciated.)

**EDIT:** 

That mismatch happens because pieces I use to FFT are too small. Using larger chunks of time domain data (16384 frames) solves the problem. 
This questions explains it:
[https://stackoverflow.com/questions/9477535/unable-to-get-correct-frequency-value-on-iphone][2]

**EDIT:** 
Here is the example project: [https://github.com/krafter/DetectingAudioFrequency][3]


  [1]: http://en.wikipedia.org/wiki/Nyquist_rate
  [2]: https://stackoverflow.com/questions/9477535/unable-to-get-correct-frequency-value-on-iphone
  [3]: https://github.com/krafter/DetectingAudioFrequency