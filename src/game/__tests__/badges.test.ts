import { describe, expect, it } from 'vitest';
import { getBadges } from '../../App';

describe('badges — threshold theo số câu', () => {
  it('Mầm non 5/5 Cộng/Trừ nhận perfect + add_sub_star', () => {
    expect(getBadges('add-sub', 5, 5, 5)).toEqual(
      expect.arrayContaining(['perfect_run', 'add_sub_star'])
    );
  });

  it('Tìm số hoàn hảo nhận find_number_star', () => {
    expect(getBadges('find-number', 8, 8, 5)).toContain('find_number_star');
  });

  it('Cộng trừ có nhớ và So sánh hoàn hảo nhận badge riêng', () => {
    expect(getBadges('carry', 10, 10, 5)).toContain('carry_master');
    expect(getBadges('comparison', 10, 10, 5)).toContain('comparison_eye');
  });

  it('Tháp đạt 80% vẫn nhận tower_wisdom (7/8 và 8/10)', () => {
    expect(getBadges('tower', 7, 8, 5)).toContain('tower_wisdom');
    expect(getBadges('tower', 8, 10, 5)).toContain('tower_wisdom');
    expect(getBadges('tower', 6, 8, 5)).not.toContain('tower_wisdom');
  });

  it('lượt đầu tiên nhận first_challenge, lượt sau thì không', () => {
    expect(getBadges('add-sub', 3, 5, 0)).toContain('first_challenge');
    expect(getBadges('add-sub', 3, 5, 1)).not.toContain('first_challenge');
  });
});
