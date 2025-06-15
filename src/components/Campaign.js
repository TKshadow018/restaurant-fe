import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import Banner from "./Banner";
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

  return (
    <>
      <div className="p-5">
        <h1 className="text-center mb-5 text-primary">Current Campaigns</h1>
        {status === 'loading' && <Loading />}
        {status === 'succeeded' && banners.length === 0 && (
          <div className="alert alert-info">No campaigns available.</div>
        )}
        {status === 'succeeded' && banners.map((banner) => (
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
