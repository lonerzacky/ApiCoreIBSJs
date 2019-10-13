const global_function = require('../helpers/global_function');
const kodetrans = require('../constants/kodetrans');

module.exports = {
    /**
     * @return {boolean}
     */
    AddTransABA: async function (abatrans) {
        let res = false;
        let kodePerkiraanPokok = await global_function.GetValByKeyValString('perk_pokok', 'aba_integrasi', 'kode_aba', abatrans.kode_integrasi);
        let kodePerkKas = '';
        if (abatrans.kode_trans === kodetrans.aba.kodeTransSetorTunai || abatrans.kode_trans === kodetrans.aba.kodeTransTarikTunai) {
            kodePerkKas = await global_function.GetValByKeyValStringSys('kode_perk_kas', 'sys_daftar_user', 'user_id', abatrans.userid);
        }
        if (abatrans.nominal > '0') {
            let transIdMaster = await global_function.GenerateTransID(abatrans.userid);
            let transMaster = await global_function.InsertTransaksiMaster(transIdMaster, 'ABA', abatrans.kuitansi,
                abatrans.tgl_trans, abatrans.keterangan, 'ABA', abatrans.abatrans_id, abatrans.userid,
                abatrans.kode_kantor, abatrans.kuitansi_id, '1');
            if (transMaster) {
                if (abatrans.my_kode_trans === '100') {
                    let transIdDetail = await global_function.GenerateTransID(abatrans.user_id);
                    // noinspection JSUnusedAssignment
                    res = await global_function.InsertTransaksiDetail(transIdDetail, transIdMaster, kodePerkKas,
                        abatrans.nominal, '0', abatrans.kode_kantor, abatrans.keterangan);
                    transIdDetail = await global_function.GenerateTransID(abatrans.userid);
                    res = await global_function.InsertTransaksiDetail(transIdDetail, transIdMaster, kodePerkiraanPokok,
                        '0', abatrans.nominal, abatrans.kode_kantor, abatrans.keterangan);
                } else {
                    let transIdDetail = await global_function.GenerateTransID(abatrans.user_id);
                    // noinspection JSUnusedAssignment
                    res = await global_function.InsertTransaksiDetail(transIdDetail, transIdMaster, kodePerkiraanPokok,
                        abatrans.pokok, '0', abatrans.kode_kantor, abatrans.keterangan);
                    transIdDetail = await global_function.GenerateTransID(abatrans.user_id);
                    res = await global_function.InsertTransaksiDetail(transIdDetail, transIdMaster, kodePerkKas,
                        '0', abatrans.pokok, abatrans.kode_kantor, abatrans.keterangan);
                }
            }
        }
        return res;
    },
};
