export const wait = (milliseconds: number): Promise<void> => new Promise((resolve) => {
    setTimeout(resolve, milliseconds)
})

export const ellipsis = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength - 3)}...`
}

export const notNull = <T>(value?: T | null): value is T => value !== null