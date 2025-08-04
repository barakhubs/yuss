import { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon(props: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            src="/favicon.png"
            alt="Yukon Savings SACCO Logo"
            className="h-9 w-9"
            {...props}
        />
    );
}
