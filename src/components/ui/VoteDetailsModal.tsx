import React, { useEffect, useState } from 'react';
import { Modal, List, Avatar, Rate, Spin, Typography } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { getVoteDetails } from '../../services/votes';

const { Text } = Typography;

interface VoteDetail {
  userId: string;
  username: string;
  gameId: string;
  gameName: string;
  rating: number;
  votedAt: Date;
}

interface VoteDetailsModalProps {
  visible: boolean;
  gameId: string;
  gameName: string;
  date: string;
  onClose: () => void;
}

const VoteDetailsModal: React.FC<VoteDetailsModalProps> = ({
  visible,
  gameId,
  gameName,
  date,
  onClose
}) => {
  const [loading, setLoading] = useState(false);
  const [voteDetails, setVoteDetails] = useState<VoteDetail[]>([]);

  useEffect(() => {
    if (visible && gameId) {
      fetchVoteDetails();
    }
  }, [visible, gameId, date]);

  const fetchVoteDetails = async () => {
    setLoading(true);
    try {
      const details = await getVoteDetails(gameId, date);
      setVoteDetails(details);
    } catch (error) {
      console.error('获取投票详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={`${gameName} - 投票详情`}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <Spin spinning={loading}>
        <List
          itemLayout="horizontal"
          dataSource={voteDetails}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                avatar={<Avatar icon={<UserOutlined />} />}
                title={item.username}
                description={
                  <div>
                    <Rate disabled value={item.rating} />
                    <Text type="secondary" style={{ marginLeft: 10 }}>
                      {new Date(item.votedAt).toLocaleString('zh-CN')}
                    </Text>
                  </div>
                }
              />
            </List.Item>
          )}
        />
        {!loading && voteDetails.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
            暂无投票记录
          </div>
        )}
      </Spin>
    </Modal>
  );
};

export default VoteDetailsModal; 