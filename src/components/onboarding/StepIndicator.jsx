import React from 'react';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StepIndicator({ currentStep, totalSteps, steps }) {
  return (
    <div className="w-full max-w-md mx-auto mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          
          return (
            <React.Fragment key={stepNumber}>
              <div className="flex flex-col items-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    transition-all duration-300 relative
                    ${isCompleted 
                      ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-black' 
                      : isCurrent 
                        ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-black ring-4 ring-amber-500/30' 
                        : 'bg-white/10 text-white/40'
                    }
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-bold">{stepNumber}</span>
                  )}
                  
                  {isCurrent && (
                    <motion.div
                      initial={{ scale: 1 }}
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 rounded-full bg-amber-500/20"
                    />
                  )}
                </motion.div>
                
                <span className={`
                  mt-2 text-xs font-medium text-center max-w-[70px]
                  ${isCurrent ? 'text-amber-400' : isCompleted ? 'text-white/70' : 'text-white/40'}
                `}>
                  {step.label}
                </span>
              </div>
              
              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-2 -mt-6">
                  <div className={`
                    h-full rounded-full transition-all duration-500
                    ${stepNumber < currentStep ? 'bg-amber-500' : 'bg-white/10'}
                  `} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}