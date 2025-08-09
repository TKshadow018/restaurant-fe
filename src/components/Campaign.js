import React, { useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import Banner from "@/components/Banner";
import Loading from "@/components/Loading";
import { fetchCampaigns } from '@/store/slices/campaignSlice';

const Campaign = () => {
  const dispatch = useDispatch();
  const { items: banners, status } = useSelector((state) => state.campaigns);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchCampaigns());
    }
  }, [dispatch, status]);

  // Filter campaigns to show only active or starting within 30 days
  const filteredBanners = useMemo(() => {
    if (!banners || banners.length === 0) return [];

    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    return banners.filter((banner) => {
      // Parse campaign dates
      const startDate = banner.campainStartDate ? new Date(banner.campainStartDate) : null;
      const endDate = banner.campainEndDate ? new Date(banner.campainEndDate) : null;

      // If no start date is set, consider it as always active
      if (!startDate) {
        // If no end date either, show it
        if (!endDate) return true;
        // If has end date, check if it's not expired
        return endDate >= now;
      }

      // If has start date, check if it's within our criteria
      const isCurrentlyActive = startDate <= now && (!endDate || endDate >= now);
      const willStartSoon = startDate > now && startDate <= thirtyDaysFromNow;

      return isCurrentlyActive || willStartSoon;
    });
  }, [banners]);

  return (
    <>
      <div className="p-5">
        {status === 'loading' && <Loading />}
        {status === 'succeeded' && filteredBanners.length === 0 && (
          <div className="alert alert-info">No active campaigns available.</div>
        )}
        {status === 'succeeded' && filteredBanners.map((banner) => (
          <Banner key={banner.id} {...banner} />
        ))}
        {status === 'failed' && (
          <div className="alert alert-danger">Failed to load campaigns.</div>
        )}
      </div>
    </>
  );
};

export default Campaign;
