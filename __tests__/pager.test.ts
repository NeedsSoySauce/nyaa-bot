import { ArrayPager } from '../src/pager.js';
import { range } from '../src/util.js';

describe('ArrayPager', () => {
    test.each([
        {
            items: range(0, 5),
            pageNumber: 0,
            pageSize: 2,
            expected: {
                items: [0, 1],
                total: 5,
                pageSize: 2,
                pageCount: 3,
                pageNumber: 0,
                hasNext: true,
                hasPrevious: false
            }
        },
        {
            items: range(0, 5),
            pageNumber: 1,
            pageSize: 2,
            expected: {
                items: [2, 3],
                total: 5,
                pageSize: 2,
                pageCount: 3,
                pageNumber: 1,
                hasNext: true,
                hasPrevious: true
            }
        },
        {
            items: range(0, 5),
            pageNumber: 2,
            pageSize: 2,
            expected: {
                items: [4],
                total: 5,
                pageSize: 2,
                pageCount: 3,
                pageNumber: 2,
                hasNext: false,
                hasPrevious: true
            }
        }
    ])('getPage($pageNumber)', ({ items, pageNumber, pageSize, expected }) => {
        const pager = new ArrayPager(items, pageSize);
        const page = pager.getPage(pageNumber)
        expect(page).toMatchObject(expected)
    })
});
