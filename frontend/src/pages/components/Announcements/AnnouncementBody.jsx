import { useEffect, useRef, useState } from 'react';

export default function AnnouncementBody({ announcement }) {
    const [expanded, setExpanded] = useState(false);
    const [truncated, setTruncated] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return undefined;

        const check = () => setTruncated(el.scrollHeight > el.clientHeight + 1);
        check();

        const imgs = el.querySelectorAll('img');
        const cleanups = [];
        imgs.forEach((img) => {
            if (img.complete) {
                check();
                return;
            }

            img.addEventListener('load', check);
            cleanups.push(() => img.removeEventListener('load', check));
        });

        return () => cleanups.forEach((cleanup) => cleanup());
    }, [announcement]);

    if (!announcement) return null;

    return (
        <div>
            <p
                ref={ref}
                className={`${expanded ? '' : 'line-clamp-2'} text-sm leading-relaxed text-slate-700 sm:text-base`}
            >
                {announcement.content || 'No content provided.'}
            </p>
            {truncated && (
                <div className="mt-2 flex justify-start">
                    <button
                        onClick={() => setExpanded((value) => !value)}
                        className="text-sm font-medium text-indigo-600 hover:underline"
                    >
                        {expanded ? 'Show less' : 'Read more'}
                    </button>
                </div>
            )}
        </div>
    );
}
