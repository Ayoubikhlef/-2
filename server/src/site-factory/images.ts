/**
 * Curated photo library for template demos.
 *
 * Every id below was verified against images.unsplash.com (HTTP 200) before
 * being added. Photos are referenced by URL instead of being bundled so the
 * repository stays small and every preview keeps loading real photography.
 *
 * Usage:
 *   photo('car', 0)              -> square product image (800x800)
 *   photo('car', 0, 1600, 1000)  -> wide cover image
 *   photos('medical', 6)         -> six gallery images
 */

const BASE = 'https://images.unsplash.com/photo-';
const PARAMS = 'auto=format&fit=crop&q=72';

export const PHOTOS = {
  car: [
    '1503376780353-7e6692767b70',
    '1494976388531-d1058494cdd8',
    '1552519507-da3b142c6e3d',
    '1502877338535-766e1452684a',
    '1549317661-bd32c8ce0db2',
    '1533473359331-0135ef1b58bf',
    '1583121274602-3e2820c69888',
    '1541899481282-d53bffe3c35d',
    '1542282088-fe8426682b8f',
  ],
  medical: [
    '1576091160399-112ba8d25d1d',
    '1505751172876-fa1923c5c528',
    '1579684385127-1ef15d508118',
    '1584982751601-97dcc096659c',
    '1631217868264-e5b90bb7e133',
    '1551076805-e1869033e561',
    '1538108149393-fbbd81895907',
    '1586773860418-d37222d8fce3',
  ],
  pharmacy: [
    '1587854692152-cbe660dbde88',
    '1584308666744-24d5c474f2ae',
    '1631549916768-4119b2e5f926',
    '1576602976047-174e57a47881',
    '1471864190281-a93a3070b6de',
  ],
  tech: [
    '1496181133206-80ce9b88a853',
    '1517336714731-489689fd1ca8',
    '1593642632823-8f785ba67e45',
    '1587829741301-dc798b83add3',
    '1527864550417-7fd91fc51a46',
    '1544244015-0df4b3ffc6b0',
    '1498049794561-7780e7231661',
    '1526738549149-8e07eca6c147',
  ],
  food: [
    '1517248135467-4c7edcad34c4',
    '1414235077428-338989a2e8c0',
    '1504674900247-0877df9cc836',
    '1555396273-367ea4eb4db5',
    '1559847844-5315695dadae',
    '1565299624946-b28f40a0ae38',
    '1512621776951-a57141f2eefd',
    '1544025162-d76694265947',
    '1563245372-f21724e3856d',
  ],
  bakery: [
    '1509440159596-0249088772ff',
    '1517433670267-08bbd4be890f',
    '1555507036-ab1f4038808a',
    '1486427944299-d1955d23e34d',
    '1578985545062-69928b1d9587',
  ],
  fashion: [
    '1483985988355-763728e1935b',
    '1445205170230-053b83016050',
    '1490481651871-ab68de25d43d',
    '1529139574466-a303027c1d8b',
    '1542291026-7eec264c27ff',
    '1548036328-c9fa89d128fa',
  ],
  beauty: [
    '1560066984-138dadb4c035',
    '1522337360788-8b13dee7a37e',
    '1487412947147-5cebf100ffc2',
    '1516975080664-ed2fc6a32937',
    '1596462502278-27bfdc403348',
  ],
  fitness: [
    '1534438327276-14e5300c3a48',
    '1571019613454-1cb2f99b2d8b',
    '1517836357463-d25dfeac3438',
    '1581009146145-b5ef050c2e1e',
    '1540497077202-7c8a3999166f',
  ],
  estate: [
    '1560518883-ce09059eeffa',
    '1568605114967-8130f3a36994',
    '1570129477492-45c003edd2be',
    '1600596542815-ffad4c1539a9',
    '1600585154340-be6161a56a0c',
  ],
  education: [
    '1523240795612-9a054b0db644',
    '1503676260728-1c00da094a0b',
    '1524995997946-a1c2e315a42f',
    '1434030216411-0b793f4b4173',
  ],
  travel: [
    '1488646953014-85cb44e25828',
    '1507525428034-b723cf961d3e',
    '1436491865332-7a61a109cc05',
    '1469854523086-cc02fe5d8800',
    '1527631746610-bca00a040d60',
  ],
  photo: [
    '1516035069371-29a1b244cc32',
    '1452587925148-ce544e77e70d',
    '1502920917128-1aa500764cbd',
  ],
  wedding: [
    '1519741497674-611481863552',
    '1465495976277-4387d4b0b4c6',
    '1511285560929-80b456fea0bc',
    '1522673607200-164d1b6ce486',
  ],
  events: [
    '1511578314322-379afb476865',
    '1492684223066-81342ee5ff30',
    '1505236858219-8359eb29e329',
    '1540575467063-178a50c2df87',
  ],
  construction: [
    '1541888946425-d81bb19240f5',
    '1503387762-592deb58ef4e',
    '1504307651254-35680f356dfd',
  ],
  agriculture: [
    '1500382017468-9049fed747ef',
    '1464226184884-fa280b87c399',
    '1574323347407-f5e1ad6d020b',
    '1471193945509-9ad0617afabf',
  ],
  law: [
    '1589829545856-d10d557cf95f',
    '1505664194779-8beaceb93744',
    '1450101499163-c8848c66ca85',
    '1521791136064-7986c2920216',
  ],
  office: [
    '1486406146926-c627a92ad1ab',
    '1497366216548-37526070297c',
    '1522071820081-009f0129c71c',
    '1503387762-592deb58ef4e',
  ],
  design: [
    '1558655146-9f40138edfeb',
    '1561070791-2526d30994b5',
    '1547658719-da2b51169166',
  ],
  person: [
    '1507003211169-0a1dd7228f2d',
    '1560250097-0b93528c311a',
    '1519085360753-af0119f7cbe7',
    '1472099645785-5658abf4ff4e',
  ],
  doctor: [
    '1651008376811-b90baee60c1f',
    '1622253692010-333f2da6031d',
    '1594824476967-48c8b964273f',
    '1612349317150-e413f6a5b16d',
  ],
  pharmacist: [
    '1594824476967-48c8b964273f',
    '1612349317150-e413f6a5b16d',
    '1559839734-2b71ea197ec2',
  ],
  landing: [
    '1581092918056-0c4c3acd3789',
    '1581092160562-40aa08e78837',
    '1518770660439-4636190af475',
    '1498050108023-c5249f4df085',
  ],
  charity: [
    '1469571486292-0ba58a3f068b',
    '1559027615-cd4628902d4a',
    '1488521787991-ed7bbaae773c',
    '1593113598332-cd288d649433',
  ],
} as const;

export type PhotoGroup = keyof typeof PHOTOS;

/** Build an Unsplash CDN URL for one photo, cropped to the requested size. */
export function photo(group: PhotoGroup, index: number, width = 800, height = 800): string {
  const list = PHOTOS[group];
  const id = list[((index % list.length) + list.length) % list.length];
  return `${BASE}${id}?${PARAMS}&w=${Math.round(width)}&h=${Math.round(height)}`;
}

/** Build `count` gallery URLs, optionally starting at a different index. */
export function photos(
  group: PhotoGroup,
  count: number,
  width = 900,
  height = 700,
  start = 0,
): string[] {
  return Array.from({ length: count }, (_, i) => photo(group, start + i, width, height));
}
